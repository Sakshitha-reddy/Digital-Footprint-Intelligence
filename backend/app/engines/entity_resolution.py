import re
import hashlib
import logging
from typing import List, Dict, Any, Tuple, Optional, Set
from urllib.parse import urlparse
from app.models.schemas import PublicProfile, ActivityItem, CandidatePerson, TargetInput

logger = logging.getLogger("neurax.resolution")

class EntityResolutionEngine:
    """
    Performs entity resolution, handle disambiguation, and cross-platform correlation.
    Determines if disparate handles/profiles belong to the same physical person.
    """
    PRIMARY_MATCH_THRESHOLD: int = 80
    CLOSE_MATCH_MARGIN: int = 10
    MAX_CANDIDATES: int = 3

    @staticmethod
    def jaro_winkler_similarity(s1: str, s2: str) -> float:
        """Computes string similarity score [0.0 - 1.0]."""
        if not s1 or not s2:
            return 0.0
        s1, s2 = s1.lower().strip(), s2.lower().strip()
        if s1 == s2:
            return 1.0

        len1, len2 = len(s1), len(s2)
        match_distance = max(len1, len2) // 2 - 1

        matches1 = [False] * len1
        matches2 = [False] * len2
        matches = 0

        for i in range(len1):
            start = max(0, i - match_distance)
            end = min(i + match_distance + 1, len2)
            for j in range(start, end):
                if not matches2[j] and s1[i] == s2[j]:
                    matches1[i] = True
                    matches2[j] = True
                    matches += 1
                    break

        if matches == 0:
            return 0.0

        t = 0
        point = 0
        for i in range(len1):
            if matches1[i]:
                while not matches2[point]:
                    point += 1
                if s1[i] != s2[point]:
                    t += 1
                point += 1
        transpositions = t / 2

        jaro = (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3.0

        # Winkler modification for common prefix up to 4 chars
        prefix = 0
        for i in range(min(4, min(len1, len2))):
            if s1[i] == s2[i]:
                prefix += 1
            else:
                break
        return round(jaro + prefix * 0.1 * (1.0 - jaro), 4)

    @staticmethod
    def normalize_handle(handle: str) -> str:
        """Removes common prefixes, underscores, and dashes."""
        return re.sub(r'[^a-zA-Z0-9]', '', handle.lower().lstrip('@'))

    @classmethod
    def correlate_handles(cls, handle_a: str, handle_b: str) -> Tuple[float, List[str]]:
        """Evaluates handle similarity and identifies morphological patterns."""
        reasons = []
        norm_a = cls.normalize_handle(handle_a)
        norm_b = cls.normalize_handle(handle_b)

        if norm_a == norm_b:
            return 1.0, ["Exact canonical handle match after normalization"]

        score = cls.jaro_winkler_similarity(norm_a, norm_b)

        # Check prefix / suffix containment (e.g. "rahul" vs "rahuldev")
        if norm_a in norm_b or norm_b in norm_a:
            score = max(score, 0.88)
            reasons.append("Substring handle co-containment (e.g., prefix/suffix variation)")

        if score >= 0.80:
            reasons.append(f"High morphological handle similarity ({int(score*100)}% match)")

        return round(score, 3), reasons

    @classmethod
    def verify_cross_link(cls, source_text: str, target_link_or_handle: str) -> bool:
        """Verifies if a profile bio or website explicitly cites the target handle/domain."""
        if not source_text or not target_link_or_handle:
            return False
        clean_target = target_link_or_handle.lower().strip().lstrip('@')
        return clean_target in source_text.lower()

    @classmethod
    def evaluate_candidate_correlation(
        cls,
        candidate_name: Optional[str],
        candidate_handle: Optional[str],
        candidate_org: Optional[str],
        candidate_bio: Optional[str],
        candidate_website: Optional[str],
        target_name: Optional[str],
        target_handle: Optional[str],
        target_affiliation: Optional[str] = None,
        target_website: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Multi-dimensional candidate attribution assessment without automatic merges.
        Combines name, handle, organization, bio, and website overlap into explainable signals.
        """
        signals = []
        scores = {}

        # 1. Name Match
        name_score = 0.0
        if candidate_name and target_name:
            name_score = cls.jaro_winkler_similarity(candidate_name, target_name)
            if name_score >= 0.88:
                signals.append(f"Strong name similarity: '{candidate_name}' ~ '{target_name}' ({int(name_score*100)}%)")
            elif name_score >= 0.70:
                signals.append(f"Moderate lexical name overlap ({int(name_score*100)}%)")
        scores["name"] = name_score

        # 2. Handle Match
        handle_score = 0.0
        if candidate_handle and target_handle:
            handle_score, handle_reasons = cls.correlate_handles(candidate_handle, target_handle)
            signals.extend(handle_reasons)
        scores["handle"] = handle_score

        # 3. Organization / Affiliation Match
        org_score = 0.0
        if candidate_org and target_affiliation:
            c_org = candidate_org.lower().strip()
            t_aff = target_affiliation.lower().strip()
            if c_org in t_aff or t_aff in c_org:
                org_score = 1.0
                signals.append(f"Corroborated organizational affiliation: '{candidate_org}'")
            else:
                org_sim = cls.jaro_winkler_similarity(c_org, t_aff)
                if org_sim >= 0.80:
                    org_score = org_sim
                    signals.append(f"Similar organization entity: '{candidate_org}' ~ '{target_affiliation}'")
        scores["organization"] = org_score

        # 4. Website / Domain Match
        web_score = 0.0
        if candidate_website and target_website:
            c_web = re.sub(r'^https?://(www\.)?', '', candidate_website.lower().strip().rstrip('/'))
            t_web = re.sub(r'^https?://(www\.)?', '', target_website.lower().strip().rstrip('/'))
            if c_web == t_web or c_web in t_web or t_web in c_web:
                web_score = 1.0
                signals.append(f"Shared authoritative domain / link: {candidate_website}")
        scores["website"] = web_score

        # 5. Cross-reference in Bio
        bio_score = 0.0
        if candidate_bio:
            if target_handle and cls.verify_cross_link(candidate_bio, target_handle):
                bio_score += 0.5
                signals.append(f"Target handle @{target_handle} cited in public profile bio")
            if target_affiliation and target_affiliation.lower() in candidate_bio.lower():
                bio_score += 0.5
                signals.append(f"Affiliation '{target_affiliation}' cited in profile bio")
        scores["bio_citation"] = min(1.0, bio_score)

        # Composite multi-factor confidence
        composite = (
            name_score * 0.30 +
            handle_score * 0.30 +
            org_score * 0.20 +
            web_score * 0.10 +
            scores["bio_citation"] * 0.10
        )

        status = "SUPPORTED" if composite >= 0.70 else ("UNCERTAIN" if composite >= 0.40 else "INSUFFICIENT_EVIDENCE")
        verdict = (
            "Likely associated based on available public evidence."
            if status == "SUPPORTED" else
            "Uncertain or uncorroborated association across disparate public indices."
        )

        return {
            "composite_score": round(composite, 3),
            "status": status,
            "verdict": verdict,
            "signals": signals,
            "scores": scores
        }

    # =========================================================================
    # CANDIDATE ENTITY RESOLUTION & DEDUPLICATION LAYER
    # =========================================================================

    @staticmethod
    def normalize_profile_url(url: str) -> str:
        """
        Normalizes a public profile URL to its canonical form for deduplication.
        e.g.:
        https://github.com/rahulsharma
        https://www.github.com/rahulsharma/
        https://github.com/rahulsharma?tab=repositories
        all collapse into https://github.com/rahulsharma.
        """
        if not url:
            return ""
        u = url.strip()
        if not u.startswith("http://") and not u.startswith("https://"):
            u = "https://" + u
        try:
            parsed = urlparse(u)
            netloc = parsed.netloc.lower()
            if netloc.startswith("www."):
                netloc = netloc[4:]
            path = parsed.path.rstrip("/")

            if "github.com" in netloc:
                parts = [p for p in path.split("/") if p]
                if parts:
                    return f"https://github.com/{parts[0].lower()}"
                return "https://github.com"
            elif "linkedin.com" in netloc:
                parts = [p for p in path.split("/") if p]
                if len(parts) >= 2 and parts[0].lower() == "in":
                    return f"https://linkedin.com/in/{parts[1].lower()}"
                elif parts:
                    return f"https://linkedin.com/{parts[-1].lower()}"
                return "https://linkedin.com"
            elif "x.com" in netloc or "twitter.com" in netloc:
                parts = [p for p in path.split("/") if p]
                if parts:
                    return f"https://x.com/{parts[0].lower()}"
                return "https://x.com"
            elif "dev.to" in netloc:
                parts = [p for p in path.split("/") if p]
                if parts:
                    return f"https://dev.to/{parts[0].lower()}"
                return "https://dev.to"
            elif "instagram.com" in netloc:
                parts = [p for p in path.split("/") if p]
                if parts:
                    return f"https://instagram.com/{parts[0].lower()}"
                return "https://instagram.com"

            return f"https://{netloc}{path.lower()}"
        except Exception:
            return u.lower().rstrip("/")

    @classmethod
    def deduplicate_profiles(cls, profiles: List[PublicProfile]) -> List[PublicProfile]:
        """
        Deduplicates public profiles pointing to the exact same canonical profile URL.
        Merges metadata if one record has richer info (e.g. bio, avatar, status).
        """
        seen: Dict[str, PublicProfile] = {}
        for p in profiles:
            norm_url = cls.normalize_profile_url(p.profile_url)
            if not norm_url or norm_url in ("https://github.com", "https://linkedin.com", "https://x.com", "https://dev.to"):
                continue
            if norm_url in seen:
                existing = seen[norm_url]
                if not existing.avatar_url and p.avatar_url:
                    existing.avatar_url = p.avatar_url
                if (not existing.bio or len(existing.bio) < len(p.bio or "")) and p.bio:
                    existing.bio = p.bio
                if not existing.verified_link and p.verified_link:
                    existing.verified_link = True
                existing.match_reasons = list(set(existing.match_reasons + p.match_reasons))
                existing.supporting_evidence = list(set(existing.supporting_evidence + p.supporting_evidence))
                existing.provenance_sources = list(set(existing.provenance_sources + p.provenance_sources))
            else:
                p.profile_url = norm_url
                seen[norm_url] = p
        return list(seen.values())

    @staticmethod
    def extract_personal_domain(url_or_text: Optional[str]) -> Optional[str]:
        """Extracts personal website domain, filtering out generic platforms and email hosts."""
        if not url_or_text:
            return None
        GENERIC_DOMAINS = {
            "github.com", "linkedin.com", "x.com", "twitter.com", "instagram.com",
            "dev.to", "youtube.com", "facebook.com", "google.com", "gmail.com",
            "yahoo.com", "outlook.com", "medium.com", "t.co", "linktr.ee", "unsplash.com"
        }
        match = re.search(r'(?:https?://)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})', url_or_text.lower())
        if match:
            domain = match.group(1)
            if domain not in GENERIC_DOMAINS and not domain.endswith(".edu") and not domain.endswith(".gov"):
                return domain
        return None

    @classmethod
    def are_profiles_same_person(cls, p1: PublicProfile, p2: PublicProfile) -> Tuple[bool, List[str]]:
        """
        Determines whether two distinct public profiles belong to the SAME physical person.
        Enforces strict rules:
        - Profiles on the same platform with different usernames are NEVER merged.
        - Profiles on different platforms are merged ONLY with strong evidence (cross-link,
          shared authoritative personal domain, or matching unique handle + college/org).
        """
        reasons = []

        # Rule 1: Same platform with different handles -> DIFFERENT people
        if p1.platform.lower() == p2.platform.lower():
            if p1.username.lower() != p2.username.lower():
                return False, []
            return True, ["Identical platform account"]

        # Rule 2: Explicit cross-link in bio
        p1_bio = (p1.bio or "").lower()
        p2_bio = (p2.bio or "").lower()
        p1_user = p1.username.lower().lstrip("@")
        p2_user = p2.username.lower().lstrip("@")

        if p1_user and (p1_user in p2_bio or p1.profile_url.lower() in p2_bio):
            reasons.append(f"Explicit cross-reference to @{p1.username} in {p2.platform} bio")
            return True, reasons
        if p2_user and (p2_user in p1_bio or p2.profile_url.lower() in p1_bio):
            reasons.append(f"Explicit cross-reference to @{p2.username} in {p1.platform} bio")
            return True, reasons

        # Rule 3: Shared authoritative personal domain
        dom1 = cls.extract_personal_domain(p1.bio)
        dom2 = cls.extract_personal_domain(p2.bio)
        if dom1 and dom2 and dom1 == dom2:
            reasons.append(f"Shared authoritative personal domain: {dom1}")
            return True, reasons

        # Rule 4: Matching unique handle across platforms (length >= 6 and not common) + same real name
        handle_sim, handle_reasons = cls.correlate_handles(p1.username, p2.username)
        name_sim = cls.jaro_winkler_similarity(p1.display_name, p2.display_name)

        if handle_sim >= 0.90 and name_sim >= 0.85:
            # Check for conflicting organizations
            org_conflict = False
            for conf_p in (p1.conflicting_evidence + p2.conflicting_evidence):
                if "mismatch" in conf_p.lower() or "organization" in conf_p.lower():
                    org_conflict = True
                    break
            if not org_conflict:
                reasons.append(f"Canonical matching handle across {p1.platform} and {p2.platform}: @{p1.username}")
                reasons.append(f"Corroborated real name: '{p1.display_name}'")
                return True, reasons

        return False, []

    @classmethod
    def group_profiles_into_candidates(
        cls,
        profiles: List[PublicProfile],
        activities: List[ActivityItem],
        target_input: TargetInput
    ) -> List[CandidatePerson]:
        """
        Clusters deduplicated profiles into Candidate People (one person can own accounts
        across GitHub, LinkedIn, Dev.to, Twitter, etc.).
        Ensures accounts belonging to the SAME person are not counted as separate people,
        and accounts from DIFFERENT people are never combined.
        """
        if not profiles:
            return []

        # Build adjacency graph over profiles
        n = len(profiles)
        adj: Dict[int, Set[int]] = {i: set() for i in range(n)}

        for i in range(n):
            for j in range(i + 1, n):
                is_same, reasons = cls.are_profiles_same_person(profiles[i], profiles[j])
                if is_same:
                    adj[i].add(j)
                    adj[j].add(i)

        # Connected components (each component is one candidate person)
        visited = set()
        candidates: List[CandidatePerson] = []

        for i in range(n):
            if i in visited:
                continue
            component_indices = []
            queue = [i]
            visited.add(i)
            while queue:
                curr = queue.pop(0)
                component_indices.append(curr)
                for neighbor in adj[curr]:
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)

            member_profiles = [profiles[idx] for idx in component_indices]

            # Determine primary profile (prioritize user_provided, then verified_link, then highest evidence score)
            sorted_members = sorted(
                member_profiles,
                key=lambda p: (
                    1 if p.origin == "user_provided" else 0,
                    1 if p.verified_link else 0,
                    p.evidence_score
                ),
                reverse=True
            )
            primary = sorted_members[0]

            # Primary display name
            person_name = primary.display_name or primary.username
            if target_input.name and cls.jaro_winkler_similarity(target_input.name, person_name) >= 0.80:
                person_name = target_input.name

            # Collect candidate activities
            candidate_platforms = {p.platform.lower() for p in member_profiles}
            candidate_activities = [
                a for a in activities if a.source_platform.lower() in candidate_platforms
            ]

            # Extract organization and role from bio or activities
            org = None
            role = None
            for p in sorted_members:
                bio = p.bio or ""
                # Simple extraction of "Role @ Org" or "@ Org"
                match_at = re.search(r'(?:at|@)\s+([A-Z][a-zA-Z0-9\s,.-]{2,35})', bio)
                if match_at and not org:
                    org = match_at.group(1).strip()
                if "|" in bio:
                    parts = [pt.strip() for pt in bio.split("|")]
                    if parts and not role:
                        role = parts[0]
            if not org and candidate_activities:
                for a in candidate_activities:
                    if a.organization:
                        org = a.organization
                        break

            cid = f"cand_{hashlib.md5(f'{primary.platform}_{primary.username}'.encode()).hexdigest()[:8]}"

            candidate = CandidatePerson(
                id=cid,
                name=person_name,
                avatar_url=primary.avatar_url or (sorted_members[1].avatar_url if len(sorted_members) > 1 else None),
                platform=primary.platform,
                username=primary.username,
                profile_url=primary.profile_url,
                organization=org or target_input.affiliation,
                role=role,
                confidence=0,
                matching_evidence=[],
                conflicting_evidence=[],
                profiles=member_profiles,
                activities=candidate_activities,
                is_selected=False
            )
            candidates.append(candidate)

        return candidates

    @classmethod
    def score_candidate_person(
        cls,
        candidate: CandidatePerson,
        target_input: TargetInput,
        uploaded_image_data_url: Optional[str] = None
    ) -> CandidatePerson:
        """
        Scores a candidate person (0-100) using multi-factor evidence signals:
        - Real Name lexical match
        - Username / seed handle correlation
        - Organization / college match
        - Location match
        - Multi-source cross-linking between profiles
        - Visual portrait match (if reference photo uploaded)
        - Activity co-occurrence
        CRITICAL: Name similarity alone must NEVER be enough to select a candidate (capped < 65%).
        """
        matching: List[str] = []
        conflicts: List[str] = []

        target_name = (target_input.name or "").strip()
        seed_handle = (target_input.seed_handle or "").strip().lstrip("@")
        target_affiliation = (target_input.affiliation or "").strip()
        target_location = (target_input.location or "").strip()

        # 1. Name Match
        name_sim = 0.50
        if target_name:
            max_n = max(cls.jaro_winkler_similarity(target_name, p.display_name) for p in candidate.profiles)
            name_sim = max_n
            if name_sim >= 0.85:
                matching.append(f"✓ Real name match ('{candidate.name}')")
            elif name_sim >= 0.70:
                matching.append(f"✓ Lexical name overlap with target ({int(name_sim*100)}%)")
            else:
                conflicts.append(f"✕ Name divergence: '{candidate.name}' vs target '{target_name}'")

        # 2. Username / Handle Match
        handle_sim = 0.40
        if seed_handle:
            max_h = 0.0
            for p in candidate.profiles:
                score_h, _ = cls.correlate_handles(seed_handle, p.username)
                max_h = max(max_h, score_h)
            handle_sim = max_h
            if handle_sim >= 0.90:
                matching.append(f"✓ Exact handle match (@{seed_handle})")
            elif handle_sim >= 0.75:
                matching.append(f"✓ Morphological handle correlation ({int(handle_sim*100)}%)")

        # 3. Organization / College Match
        affiliation_match = 0.45
        if target_affiliation:
            has_org_match = False
            for p in candidate.profiles:
                bio_lower = (p.bio or "").lower()
                aff_lower = target_affiliation.lower()
                if aff_lower in bio_lower or (candidate.organization and aff_lower in candidate.organization.lower()):
                    has_org_match = True
                    break
            if has_org_match:
                affiliation_match = 1.0
                matching.append(f"✓ Corroborated organizational affiliation ({target_affiliation})")
            elif candidate.organization and candidate.organization.lower() != target_affiliation.lower():
                affiliation_match = 0.20
                conflicts.append(f"✕ Organization mismatch: '{candidate.organization}' vs '{target_affiliation}'")

        # 4. Location Match
        location_match = 0.40
        if target_location:
            has_loc_match = False
            for p in candidate.profiles:
                bio_lower = (p.bio or "").lower()
                loc_lower = target_location.lower()
                if loc_lower in bio_lower:
                    has_loc_match = True
                    break
            if has_loc_match:
                location_match = 1.0
                matching.append(f"✓ Matching geographic location ({target_location})")

        # 5. Cross-link Provenance & Multi-Account Corroboration
        has_multi_accounts = len(candidate.profiles) >= 2
        has_verified_link = any(p.verified_link for p in candidate.profiles)
        if has_multi_accounts and has_verified_link:
            cross_link_score = 1.0
            matching.append(f"✓ Cross-linked identity verified across {len(candidate.profiles)} independent platforms")
        elif has_multi_accounts:
            cross_link_score = 0.85
            matching.append(f"✓ Discovered accounts on {len(candidate.profiles)} platforms ({', '.join(p.platform for p in candidate.profiles)})")
        elif has_verified_link:
            cross_link_score = 0.70
            matching.append("✓ Public domain link in profile bio")
        else:
            cross_link_score = 0.35
            conflicts.append("✕ Single uncorroborated platform account")

        # 6. Activity Count
        act_score = min(1.0, len(candidate.activities) * 0.15)
        if candidate.activities:
            matching.append(f"✓ Active public activity stream ({len(candidate.activities)} events/repositories)")

        # 7. Visual Similarity
        visual_sim = 0.50
        if uploaded_image_data_url and candidate.avatar_url:
            from app.engines.visual_matcher import VisualIdentityMatcher
            visual_sim = VisualIdentityMatcher.compare_images(uploaded_image_data_url, candidate.avatar_url)
            if visual_sim >= 0.80:
                matching.append("✓ Visual facial biometric vector match")

        # Composite Scoring
        has_affil_input = bool(target_affiliation)
        has_handle_input = bool(seed_handle)
        has_name_input = bool(target_name)

        w_cross = 0.28
        w_org = 0.22 if has_affil_input else 0.10
        w_handle = 0.20 if has_handle_input else 0.10
        w_name = 0.16 if has_name_input else 0.08
        w_loc = 0.08 if target_location else 0.04
        w_act = 0.06

        total_w = w_cross + w_org + w_handle + w_name + w_loc + w_act
        raw = (
            w_cross * cross_link_score +
            w_org * affiliation_match +
            w_handle * handle_sim +
            w_name * name_sim +
            w_loc * location_match +
            w_act * act_score
        ) / total_w

        score = int(round(raw * 100))
        if conflicts:
            score = max(5, score - (8 * len(conflicts)))

        # Rule: Name similarity alone must NEVER be enough to select a person (capped at 65)
        if has_name_input and not has_handle_input and not has_affil_input and not has_multi_accounts:
            score = min(score, 65)

        # 8. ML Identity Resolution Prediction (Calibrated Scikit-Learn Model)
        try:
            from app.engines.identity_ml import identity_ml_engine
            primary_p = candidate.profiles[0] if candidate.profiles else None
            if primary_p:
                ml_feats = identity_ml_engine.extract_features(
                    target_name=target_name,
                    seed_handle=seed_handle,
                    target_affiliation=target_affiliation,
                    target_website=target_input.website,
                    target_email=target_input.email,
                    target_location=target_location,
                    profile=primary_p,
                    all_profiles=candidate.profiles
                )
                proba, verdict, ml_signals = identity_ml_engine.predict_match(ml_feats)
                # Display explainable ML model verdict e.g. "🤖 94% model-supported match"
                matching.insert(0, f"🤖 {verdict}")
                for sig in ml_signals:
                    if not any(sig.lower() in m.lower() for m in matching):
                        matching.append(f"✓ {sig}")
                # Blend ML probability into overall composite confidence
                ml_score = int(round(proba * 100))
                score = int(round(0.55 * score + 0.45 * ml_score))
        except Exception as e:
            logger.debug(f"ML identity scoring skipped: {e}")

        candidate.confidence = max(5, min(99, score))
        candidate.matching_evidence = matching or ["✓ Publicly indexed online finding"]
        candidate.conflicting_evidence = conflicts
        return candidate

    @classmethod
    def resolve_candidates(
        cls,
        candidates: List[CandidatePerson]
    ) -> Tuple[str, Optional[CandidatePerson], List[CandidatePerson]]:
        """
        Determines the identity resolution status:
        1. Scores all candidates and sorts descending by confidence.
        2. Keeps at most MAX_CANDIDATES (3).
        3. CASE 1 — CLEAR MATCH:
           If top candidate >= PRIMARY_MATCH_THRESHOLD (80) and margin to 2nd candidate >= CLOSE_MATCH_MARGIN (10):
           -> status = "unique", automatically select candidate.
        4. CASE 2 — TWO OR THREE CLOSE MATCHES:
           If top candidates have margin < CLOSE_MATCH_MARGIN (10):
           -> status = "ambiguous", return top 2-3 candidates for user selection.
        5. CASE 7 — INSUFFICIENT EVIDENCE:
           If top candidate < 40%:
           -> status = "insufficient", return candidates with guardrail warning.
        """
        if not candidates:
            return "insufficient", None, []

        # Sort descending by confidence
        sorted_candidates = sorted(candidates, key=lambda c: c.confidence, reverse=True)

        # Cap to MAX_CANDIDATES (3)
        top_candidates = sorted_candidates[:cls.MAX_CANDIDATES]

        if not top_candidates:
            return "insufficient", None, []

        top_1 = top_candidates[0]

        # Case 7: Insufficient evidence guardrail
        if top_1.confidence < 40:
            for c in top_candidates:
                c.is_selected = False
            return "insufficient", None, top_candidates

        # Exactly 1 candidate
        if len(top_candidates) == 1:
            if top_1.confidence >= cls.PRIMARY_MATCH_THRESHOLD or top_1.confidence >= 50:
                top_1.is_selected = True
                return "unique", top_1, top_candidates
            else:
                top_1.is_selected = False
                return "insufficient", None, top_candidates

        # 2 or 3 candidates
        top_2 = top_candidates[1]
        margin = top_1.confidence - top_2.confidence

        if top_1.confidence >= cls.PRIMARY_MATCH_THRESHOLD and margin >= cls.CLOSE_MATCH_MARGIN:
            # CASE 1: Clear strong match
            top_1.is_selected = True
            for c in top_candidates[1:]:
                c.is_selected = False
            return "unique", top_1, top_candidates
        else:
            # CASE 2: Two or three close matches
            for c in top_candidates:
                c.is_selected = False
            return "ambiguous", None, top_candidates

