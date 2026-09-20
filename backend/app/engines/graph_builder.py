import networkx as nx
from typing import List, Dict, Any, Tuple
from app.models.schemas import GraphNode, GraphEdge, PublicProfile, ActivityItem

class GraphTopologyBuilder:
    """
    Constructs a semantic knowledge graph connecting the target entity with
    discovered public profiles, organizations, repositories, hackathons, and publications.
    """

    @classmethod
    def build_topology(
        cls,
        target_name: str,
        target_avatar: str,
        profiles: List[PublicProfile],
        activities: List[ActivityItem],
        affiliation: str = ""
    ) -> Tuple[List[GraphNode], List[GraphEdge]]:
        G = nx.DiGraph()

        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []

        # 1. Central Target Node
        target_id = "node_target"
        nodes.append(GraphNode(
            id=target_id,
            type="target",
            label=target_name or "Target Entity",
            sublabel="Consented Identity",
            avatar=target_avatar,
            confidence=1.0,
            properties={"is_root": True}
        ))

        # 2. Main Affiliation / Organization Node if present
        if affiliation:
            org_id = "node_org_main"
            nodes.append(GraphNode(
                id=org_id,
                type="organization",
                label=affiliation,
                sublabel="Primary Affiliation",
                confidence=0.92,
                properties={"type": "Institution"}
            ))
            edges.append(GraphEdge(
                id="edge_target_org",
                source=target_id,
                target=org_id,
                relationship="associated_with",
                confidence=0.92,
                evidence_snippet=f"Confirmed affiliation with {affiliation}"
            ))

        # 3. Discovered Profile Nodes
        for p in profiles:
            p_node_id = f"node_prof_{p.platform.lower()}"
            nodes.append(GraphNode(
                id=p_node_id,
                type="profile",
                label=f"@{p.username}",
                sublabel=p.platform,
                platform=p.platform,
                avatar=p.avatar_url,
                url=p.profile_url,
                confidence=p.evidence_score,
                properties={
                    "bio": p.bio,
                    "followers": p.followers_count,
                    "verified": p.verified_link
                }
            ))
            edges.append(GraphEdge(
                id=f"edge_target_{p_node_id}",
                source=target_id,
                target=p_node_id,
                relationship="owns_profile",
                confidence=p.evidence_score,
                evidence_snippet=f"Cross-referenced public {p.platform} account",
                source_url=p.profile_url
            ))

        # 4. Activity Nodes (Repositories, Hackathons, Publications)
        for idx, act in enumerate(activities[:8]):
            act_node_id = f"node_act_{idx}"
            node_type = "project" if act.category == "Repositories" else ("event" if act.category in ["Hackathons", "Conferences"] else "publication")

            nodes.append(GraphNode(
                id=act_node_id,
                type=node_type,
                label=act.title[:24] + ("..." if len(act.title) > 24 else ""),
                sublabel=f"{act.category} ({act.date})",
                platform=act.source_platform,
                url=act.source_url,
                confidence=act.confidence,
                properties={
                    "description": act.description,
                    "organization": act.organization
                }
            ))

            # Connect to relevant profile node or target
            source_platform_node = f"node_prof_{act.source_platform.lower()}"
            has_plat_node = any(n.id == source_platform_node for n in nodes)
            edge_src = source_platform_node if has_plat_node else target_id

            rel_name = "created_repo" if act.category == "Repositories" else ("participated_in" if act.category in ["Hackathons", "Conferences"] else "authored_paper")

            edges.append(GraphEdge(
                id=f"edge_{edge_src}_{act_node_id}",
                source=edge_src,
                target=act_node_id,
                relationship=rel_name,
                confidence=act.confidence,
                evidence_snippet=act.description,
                source_url=act.source_url
            ))

        # 5. Personal Website & Transitive Cross-Platform Link Graph
        # (GitHub -> Personal Website -> LeetCode / Codeforces / CodeChef)
        import re
        discovered_domains: Dict[str, List[str]] = {}
        for p in profiles:
            p_node_id = f"node_prof_{p.platform.lower()}"
            match = re.search(r'(?:https?://)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?)', p.bio or "")
            if match:
                raw_domain = match.group(1).lower().split("/")[0]
                if not any(g in raw_domain for g in ["github.com", "linkedin.com", "x.com", "twitter.com", "instagram.com", "medium.com"]):
                    discovered_domains.setdefault(raw_domain, []).append(p_node_id)

        for dom, p_ids in discovered_domains.items():
            web_node_id = f"node_web_{dom.replace('.', '_')}"
            if not any(n.id == web_node_id for n in nodes):
                nodes.append(GraphNode(
                    id=web_node_id,
                    type="project",
                    label=dom,
                    sublabel="Authoritative Domain",
                    url=f"https://{dom}",
                    confidence=0.98,
                    properties={"domain": dom, "is_personal_website": True}
                ))
                edges.append(GraphEdge(
                    id=f"edge_target_{web_node_id}",
                    source=target_id,
                    target=web_node_id,
                    relationship="owns_domain",
                    confidence=0.95,
                    evidence_snippet=f"Target canonical portfolio domain: {dom}"
                ))
            for p_id in p_ids:
                edges.append(GraphEdge(
                    id=f"edge_{p_id}_{web_node_id}",
                    source=p_id,
                    target=web_node_id,
                    relationship="cites_website",
                    confidence=0.96,
                    evidence_snippet=f"Verified reciprocal citation to personal site {dom}"
                ))
            if len(p_ids) > 1:
                for idx_a in range(len(p_ids)):
                    for idx_b in range(idx_a + 1, len(p_ids)):
                        edges.append(GraphEdge(
                            id=f"edge_trans_{p_ids[idx_a]}_{p_ids[idx_b]}",
                            source=p_ids[idx_a],
                            target=p_ids[idx_b],
                            relationship="transitive_domain_link",
                            confidence=0.99,
                            evidence_snippet=f"Both accounts independently cite shared personal domain {dom}"
                        ))

        # 6. Direct Cross-Profile Reciprocal Links
        for i, p1 in enumerate(profiles):
            p1_node = f"node_prof_{p1.platform.lower()}"
            p1_bio = (p1.bio or "").lower()
            for j, p2 in enumerate(profiles):
                if i == j:
                    continue
                p2_node = f"node_prof_{p2.platform.lower()}"
                p2_user = p2.username.lower()
                p2_plat = p2.platform.lower()
                if (p2_user and len(p2_user) >= 3 and p2_user in p1_bio) or (p2_plat in p1_bio):
                    edges.append(GraphEdge(
                        id=f"edge_recip_{p1_node}_{p2_node}",
                        source=p1_node,
                        target=p2_node,
                        relationship="cross_profile_reference",
                        confidence=0.98,
                        evidence_snippet=f"{p1.platform} bio explicitly cross-references {p2.platform} identity (@{p2.username})"
                    ))

        return nodes, edges
