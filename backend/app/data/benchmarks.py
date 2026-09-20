from typing import Dict, Any

BENCHMARK_SCENARIOS: Dict[str, Dict[str, Any]] = {
    "case_multi_alias": {
        "id": "case_multi_alias",
        "title": "Scenario 1: Multi-Alias AI Security Developer",
        "description": "Same individual using 3 different handles (@arjundev, @arjun_sec, @ak_research) across GitHub, X, and personal site.",
        "input": {
            "name": "Arjun Kumar",
            "seed_handle": "arjundev",
            "affiliation": "Indian Institute of Technology, Hyderabad",
            "location": "Hyderabad, India",
            "image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
            "consent_confirmed": True
        },
        "likely_identity": "Arjun Kumar",
        "visual_similarity_score": 0.94,
        "profiles": [
            {
                "platform": "GitHub",
                "username": "arjundev",
                "display_name": "Arjun Kumar",
                "profile_url": "https://github.com/arjundev",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
                "bio": "AI Security Researcher | IIT Hyderabad | Building autonomous LLM guardrails | arjun.codes",
                "followers_count": 428,
                "verified_link": True,
                "evidence_score": 0.96,
                "match_reasons": ["Bi-directional personal domain link", "Matching full name & IIT Hyderabad affiliation"]
            },
            {
                "platform": "X/Twitter",
                "username": "arjun_sec",
                "display_name": "Arjun K. 🛡️",
                "profile_url": "https://x.com/arjun_sec",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
                "bio": "Offensive AI & Prompt Injection research. Creator of GuardFlow. Links: arjun.codes/github",
                "followers_count": 1850,
                "verified_link": True,
                "evidence_score": 0.92,
                "match_reasons": ["Direct link to personal website 'arjun.codes'", "Shared project GuardFlow references"]
            },
            {
                "platform": "LinkedIn",
                "username": "arjun-kumar-iith",
                "display_name": "Arjun Kumar",
                "profile_url": "https://linkedin.com/in/arjun-kumar-iith",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
                "bio": "AI Security Engineer @ CyberShield AI | B.Tech CSE @ IIT Hyderabad (2022-2026)",
                "followers_count": 2100,
                "verified_link": True,
                "evidence_score": 0.94,
                "match_reasons": ["Matching visual portrait", "Same degree program & graduation timeline"]
            },
            {
                "platform": "Google Scholar",
                "username": "ak_research",
                "display_name": "Arjun Kumar (IIT Hyderabad)",
                "profile_url": "https://scholar.google.com/citations?user=ak_research",
                "avatar_url": None,
                "bio": "Focus on Adversarial Robustness and Neural Network Verification",
                "followers_count": 64,
                "verified_link": False,
                "evidence_score": 0.88,
                "match_reasons": ["Co-authored papers with IIT Hyderabad AI faculty"]
            }
        ],
        "aliases": ["@arjundev", "@arjun_sec", "@ak_research", "Arjun K."],
        "activities": [
            {
                "id": "act_1",
                "category": "Education",
                "title": "B.Tech in Computer Science & Engineering",
                "description": "Enrolled at Indian Institute of Technology, Hyderabad (AI & Cybersecurity focus).",
                "organization": "IIT Hyderabad",
                "date": "2022-08",
                "source_url": "https://linkedin.com/in/arjun-kumar-iith",
                "source_platform": "LinkedIn",
                "confidence": 0.98
            },
            {
                "id": "act_2",
                "category": "Repositories",
                "title": "GuardFlow-Agent-Defense",
                "description": "Open-source zero-trust agentic firewall for LLM tool executions. 850+ Stars.",
                "organization": "GitHub",
                "date": "2024-03",
                "source_url": "https://github.com/arjundev/guardflow",
                "source_platform": "GitHub",
                "confidence": 0.95
            },
            {
                "id": "act_3",
                "category": "Hackathons",
                "title": "Winner - Smart Cyber Defense Hackathon 2024",
                "description": "1st place in Domain 3 (AI Threat Intelligence) with automated OSINT graph correlation.",
                "organization": "CyberDef Con",
                "date": "2024-11",
                "source_url": "https://devpost.com/software/cyber-graph-intel",
                "source_platform": "Devpost",
                "confidence": 0.93
            },
            {
                "id": "act_4",
                "category": "Publications",
                "title": "Adversarial Perturbation Defense in Vision-Language Agents",
                "description": "Published in IEEE Symposium on Security and Privacy (S&P Workshops).",
                "organization": "IEEE",
                "date": "2025-04",
                "source_url": "https://scholar.google.com/citations?user=ak_research",
                "source_platform": "Google Scholar",
                "confidence": 0.90
            },
            {
                "id": "act_5",
                "category": "Conferences",
                "title": "Keynote Speaker: Threat Intelligence with Knowledge Graphs",
                "description": "Technical session on graphing multi-alias attacker footprints at Nullcon Goa.",
                "organization": "Nullcon",
                "date": "2025-09",
                "source_url": "https://nullcon.net/speakers/arjun-kumar",
                "source_platform": "Conference",
                "confidence": 0.91
            },
            {
                "id": "act_6",
                "category": "Patents",
                "title": "Patent Pending: Multi-Modal Graph Neural Network for Threat Entity Correlation",
                "description": "Indian Patent Application #202641098231.",
                "organization": "Indian Patent Office",
                "date": "2026-01",
                "source_url": "https://ipindiaonline.gov.in",
                "source_platform": "Patents",
                "confidence": 0.86
            }
        ],
        "conflicts": [],
        "overall_confidence": 94,
        "resolution_status": "unique",
        "primary_candidate": {
            "id": "cand_arjun_kumar",
            "name": "Arjun Kumar",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
            "platform": "GitHub",
            "username": "arjundev",
            "profile_url": "https://github.com/arjundev",
            "organization": "Indian Institute of Technology, Hyderabad",
            "role": "AI Security Researcher",
            "confidence": 94,
            "matching_evidence": [
                "✓ Cross-linked identity verified across 4 independent platforms",
                "✓ Direct link to personal website 'arjun.codes'",
                "✓ Matching full name & IIT Hyderabad affiliation",
                "✓ 6 verified activity artifacts (repositories, hackathons, publications)"
            ],
            "conflicting_evidence": [],
            "is_selected": True
        },
        "candidates": [
            {
                "id": "cand_arjun_kumar",
                "name": "Arjun Kumar",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
                "platform": "GitHub",
                "username": "arjundev",
                "profile_url": "https://github.com/arjundev",
                "organization": "Indian Institute of Technology, Hyderabad",
                "role": "AI Security Researcher",
                "confidence": 94,
                "matching_evidence": [
                    "✓ Cross-linked identity verified across 4 independent platforms",
                    "✓ Direct link to personal website 'arjun.codes'",
                    "✓ Matching full name & IIT Hyderabad affiliation",
                    "✓ 6 verified activity artifacts (repositories, hackathons, publications)"
                ],
                "conflicting_evidence": [],
                "is_selected": True
            }
        ]
    },
    "case_disambiguation": {
        "id": "case_disambiguation",
        "title": "Scenario 2: Common Name Disambiguation",
        "description": "Resolving between two engineers named 'Rahul Sharma' (Candidate A: Hyderabad vs Candidate B: Bengaluru).",
        "input": {
            "name": "Rahul Sharma",
            "seed_handle": "rahul_s",
            "affiliation": "BITS Pilani, Hyderabad Campus",
            "location": "Hyderabad, Telangana",
            "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
            "consent_confirmed": True
        },
        "likely_identity": "Rahul Sharma (BITS Hyderabad)",
        "visual_similarity_score": 0.89,
        "profiles": [
            {
                "platform": "GitHub",
                "username": "rahulsharma-bits",
                "display_name": "Rahul Sharma",
                "profile_url": "https://github.com/rahulsharma-bits",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
                "bio": "Systems Engineering & Rust enthusiast @ BITS Hyderabad | rahulsharma.io",
                "followers_count": 190,
                "verified_link": True,
                "evidence_score": 0.91,
                "match_reasons": ["Explicit college mention in bio", "Matching domain cross-link"]
            },
            {
                "platform": "LinkedIn",
                "username": "rahul-sharma-bits-hyd",
                "display_name": "Rahul Sharma",
                "profile_url": "https://linkedin.com/in/rahul-sharma-bits-hyd",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
                "bio": "Undergraduate Student at BITS Pilani, Hyderabad Campus",
                "followers_count": 850,
                "verified_link": True,
                "evidence_score": 0.93,
                "match_reasons": ["Exact university match", "Disambiguated from Bengaluru candidate by degree records"]
            },
            {
                "platform": "GitHub",
                "username": "rahulsharma-dev-blr",
                "display_name": "Rahul Sharma",
                "profile_url": "https://github.com/rahulsharma-dev-blr",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
                "bio": "Cloud Native & DevOps Engineer | Bengaluru, Karnataka | InfraCloud",
                "followers_count": 420,
                "verified_link": True,
                "evidence_score": 0.86,
                "match_reasons": ["Lexical real name match", "Public cloud repositories", "Discovered in regional developer index"]
            }
        ],
        "aliases": ["@rahulsharma-bits", "@rahulsharma-dev-blr", "Rahul S."],
        "activities": [
            {
                "id": "act_d1",
                "category": "Education",
                "title": "B.E. Computer Science",
                "description": "BITS Pilani, Hyderabad Campus (2023-2027).",
                "organization": "BITS Pilani",
                "date": "2023-08",
                "source_url": "https://linkedin.com/in/rahul-sharma-bits-hyd",
                "source_platform": "LinkedIn",
                "confidence": 0.95
            },
            {
                "id": "act_d2",
                "category": "Repositories",
                "title": "kernel-ebpf-monitor",
                "description": "High performance Linux kernel security monitor written in Rust.",
                "organization": "GitHub",
                "date": "2024-06",
                "source_url": "https://github.com/rahulsharma-bits/ebpf-mon",
                "source_platform": "GitHub",
                "confidence": 0.92
            },
            {
                "id": "act_d3",
                "category": "Hackathons",
                "title": "Finalist - InOut Hackathon",
                "description": "Built distributed consensus prototype with Rust & WebRTC.",
                "organization": "InOut",
                "date": "2025-02",
                "source_url": "https://devpost.com",
                "source_platform": "Devpost",
                "confidence": 0.88
            }
        ],
        "conflicts": [],
        "overall_confidence": 91,
        "resolution_status": "ambiguous",
        "primary_candidate": None,
        "candidates": [
            {
                "id": "cand_rahul_a",
                "name": "Rahul Sharma (BITS Hyderabad)",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
                "platform": "GitHub",
                "username": "rahulsharma-bits",
                "profile_url": "https://github.com/rahulsharma-bits",
                "organization": "BITS Pilani, Hyderabad Campus",
                "role": "Systems Researcher & Student",
                "confidence": 91,
                "matching_evidence": [
                    "✓ Explicit university match: BITS Pilani, Hyderabad Campus",
                    "✓ Shared authoritative domain cross-link: rahulsharma.io",
                    "✓ Lexical real name match ('Rahul Sharma')",
                    "✓ Kernel eBPF monitor project authorship"
                ],
                "conflicting_evidence": [],
                "is_selected": False
            },
            {
                "id": "cand_rahul_b",
                "name": "Rahul Sharma (Bengaluru)",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
                "platform": "GitHub",
                "username": "rahulsharma-dev-blr",
                "profile_url": "https://github.com/rahulsharma-dev-blr",
                "organization": "InfraCloud Bengaluru",
                "role": "Cloud Systems Engineer",
                "confidence": 86,
                "matching_evidence": [
                    "✓ Lexical real name match ('Rahul Sharma')",
                    "✓ Active public developer repositories (420 followers)"
                ],
                "conflicting_evidence": [
                    "✕ Organization mismatch: 'InfraCloud' vs target 'BITS Pilani'",
                    "✕ Location discrepancy: Bengaluru, Karnataka vs Hyderabad"
                ],
                "is_selected": False
            }
        ]
    },
    "case_conflict": {
        "id": "case_conflict",
        "title": "Scenario 3: Anomaly & Conflict Detection",
        "description": "Profile exhibits contradictory geographic location data (Seattle vs Bengaluru) and concurrent conflicting job claims.",
        "input": {
            "name": "Sneha Patel",
            "seed_handle": "sneha_patel_dev",
            "affiliation": "CloudScale Inc",
            "location": "Bengaluru, India",
            "image_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
            "consent_confirmed": True
        },
        "likely_identity": "Sneha Patel",
        "visual_similarity_score": 0.86,
        "profiles": [
            {
                "platform": "GitHub",
                "username": "sneha-cloud",
                "display_name": "Sneha Patel",
                "profile_url": "https://github.com/sneha-cloud",
                "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
                "bio": "DevOps & Kubernetes Engineer | Location: Seattle, WA | snehapatel.dev",
                "followers_count": 310,
                "verified_link": True,
                "evidence_score": 0.84,
                "match_reasons": ["Matching domain link", "Discrepancy in location metadata"]
            },
            {
                "platform": "LinkedIn",
                "username": "sneha-patel-bengaluru",
                "display_name": "Sneha Patel",
                "profile_url": "https://linkedin.com/in/sneha-patel-bengaluru",
                "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
                "bio": "Senior Cloud Architect @ CloudScale Bengaluru (Full-time on-site)",
                "followers_count": 1400,
                "verified_link": True,
                "evidence_score": 0.82,
                "match_reasons": ["Matching employer CloudScale", "Location registered as Bengaluru"]
            }
        ],
        "aliases": ["@sneha-cloud", "Sneha P."],
        "activities": [
            {
                "id": "act_c1",
                "category": "Career",
                "title": "Senior Cloud Architect",
                "description": "Leading multi-region cloud security posture management.",
                "organization": "CloudScale Inc",
                "date": "2023-01",
                "source_url": "https://linkedin.com",
                "source_platform": "LinkedIn",
                "confidence": 0.90
            },
            {
                "id": "act_c2",
                "category": "Repositories",
                "title": "terraform-aws-zero-trust",
                "description": "Zero-trust reference architecture for AWS ECS & Vault.",
                "organization": "GitHub",
                "date": "2024-04",
                "source_url": "https://github.com/sneha-cloud/zt-infra",
                "source_platform": "GitHub",
                "confidence": 0.89
            }
        ],
        "conflicts": [
            {
                "id": "conf_loc_1",
                "field": "Geographical Residence",
                "source_a": "GitHub Profile (sneha-cloud)",
                "value_a": "Seattle, Washington, USA",
                "source_b": "LinkedIn Profile (sneha-patel-bengaluru)",
                "value_b": "Bengaluru, Karnataka, India",
                "severity": "high",
                "explanation": "Contradictory current location claims detected across verified profiles during the same 2025 calendar period.",
                "reconciliation_suggestion": "Verify if candidate is currently on an international work visa or if GitHub location was set to company HQ."
            }
        ],
        "overall_confidence": 74,
        "resolution_status": "unique",
        "primary_candidate": {
            "id": "cand_sneha_patel",
            "name": "Sneha Patel",
            "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
            "platform": "GitHub",
            "username": "sneha-cloud",
            "profile_url": "https://github.com/sneha-cloud",
            "organization": "CloudScale Inc",
            "role": "Senior Cloud Architect",
            "confidence": 74,
            "matching_evidence": [
                "✓ Corroborated employer CloudScale across profiles",
                "✓ Shared personal domain link: snehapatel.dev",
                "✓ Real name match ('Sneha Patel')"
            ],
            "conflicting_evidence": [
                "✕ Residence conflict: Seattle, WA vs Bengaluru, India"
            ],
            "is_selected": True
        },
        "candidates": [
            {
                "id": "cand_sneha_patel",
                "name": "Sneha Patel",
                "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
                "platform": "GitHub",
                "username": "sneha-cloud",
                "profile_url": "https://github.com/sneha-cloud",
                "organization": "CloudScale Inc",
                "role": "Senior Cloud Architect",
                "confidence": 74,
                "matching_evidence": [
                    "✓ Corroborated employer CloudScale across profiles",
                    "✓ Shared personal domain link: snehapatel.dev",
                    "✓ Real name match ('Sneha Patel')"
                ],
                "conflicting_evidence": [
                    "✕ Residence conflict: Seattle, WA vs Bengaluru, India"
                ],
                "is_selected": True
            }
        ]
    },
    "case_insufficient": {
        "id": "case_insufficient",
        "title": "Scenario 4: Insufficient Evidence (Safety Guardrail)",
        "description": "Target input has common name, no bio cross-links, and weak visual correlation. System flags high uncertainty.",
        "input": {
            "name": "Alex Vance",
            "seed_handle": "alex_v",
            "affiliation": "TechCorp",
            "location": "Remote",
            "image_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
            "consent_confirmed": True
        },
        "likely_identity": "Alex Vance (Unresolved Candidates)",
        "visual_similarity_score": 0.54,
        "profiles": [
            {
                "platform": "GitHub",
                "username": "alex-v-99",
                "display_name": "Alex V.",
                "profile_url": "https://github.com/alex-v-99",
                "avatar_url": None,
                "bio": "Coder",
                "followers_count": 3,
                "verified_link": False,
                "evidence_score": 0.42,
                "match_reasons": ["Generic name match", "No bio cross-link", "Low repository activity"]
            }
        ],
        "aliases": ["@alex-v-99"],
        "activities": [
            {
                "id": "act_i1",
                "category": "Repositories",
                "title": "hello-world-fork",
                "description": "Forked repository with 0 commits.",
                "organization": "GitHub",
                "date": "2025-01",
                "source_url": "https://github.com",
                "source_platform": "GitHub",
                "confidence": 0.40
            }
        ],
        "conflicts": [
            {
                "id": "conf_insuf_1",
                "field": "Identity Verification",
                "source_a": "Target Input",
                "value_a": "Alex Vance (TechCorp)",
                "source_b": "Discovered Profiles",
                "value_b": "Generic Alex V. accounts",
                "severity": "high",
                "explanation": "Insufficient signal weight: No bi-directional links or distinctive affiliation records to establish high-confidence attribution.",
                "reconciliation_suggestion": "Request additional seed context (e.g. verified email domain or specific repository URL) to prevent false positive identity attribution."
            }
        ],
        "overall_confidence": 38,
        "resolution_status": "insufficient",
        "primary_candidate": None,
        "candidates": [
            {
                "id": "cand_alex_v",
                "name": "Alex V.",
                "avatar_url": None,
                "platform": "GitHub",
                "username": "alex-v-99",
                "profile_url": "https://github.com/alex-v-99",
                "organization": "Unknown",
                "role": "Coder",
                "confidence": 38,
                "matching_evidence": [
                    "✓ Partial lexical name overlap with target"
                ],
                "conflicting_evidence": [
                    "✕ Sparse corroborating activity (0 commits, 3 followers)",
                    "✕ Single uncorroborated platform account",
                    "✕ No verified employer or institutional affiliation"
                ],
                "is_selected": False
            }
        ]
    }
}
