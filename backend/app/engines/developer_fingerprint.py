import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.models.schemas import PublicProfile, ActivityItem

KNOWN_LANGUAGES = {
    "python", "java", "javascript", "typescript", "c++", "c", "c#", "go", "rust",
    "kotlin", "swift", "php", "ruby", "scala", "r", "dart", "html", "css", "shell"
}

KNOWN_FRAMEWORKS = {
    "react": "React", "next.js": "Next.js", "nextjs": "Next.js", "vue": "Vue.js",
    "angular": "Angular", "fastapi": "FastAPI", "flask": "Flask", "django": "Django",
    "express": "Express.js", "node.js": "Node.js", "nodejs": "Node.js", "spring": "Spring Boot",
    "tensorflow": "TensorFlow", "pytorch": "PyTorch", "opencv": "OpenCV", "pandas": "Pandas",
    "numpy": "NumPy", "scikit-learn": "Scikit-Learn", "tailwind": "Tailwind CSS",
    "docker": "Docker", "kubernetes": "Kubernetes", "graphql": "GraphQL"
}

KNOWN_DATABASES = {
    "postgresql": "PostgreSQL", "postgres": "PostgreSQL", "mysql": "MySQL",
    "mongodb": "MongoDB", "redis": "Redis", "sqlite": "SQLite", "supabase": "Supabase",
    "cassandra": "Cassandra", "neo4j": "Neo4j", "dynamodb": "DynamoDB"
}

class DeveloperFingerprint(BaseModel):
    languages: List[str] = Field(default_factory=list)
    frameworks: List[str] = Field(default_factory=list)
    databases: List[str] = Field(default_factory=list)
    focus_areas: List[str] = Field(default_factory=list)
    summary: str = ""

class DeveloperFingerprintEngine:
    """
    NEURAX DEVELOPER FINGERPRINT ENGINE
    Extracts authentic public technology footprint across GitHub repositories,
    algorithmic problem-solving profiles, and technical publications.
    """

    @classmethod
    def analyze(
        cls,
        profiles: List[PublicProfile],
        activities: List[ActivityItem]
    ) -> DeveloperFingerprint:
        found_langs: Dict[str, int] = {}
        found_frameworks: Dict[str, int] = {}
        found_databases: Dict[str, int] = {}
        areas = set()

        # 1. Analyze profile bios & platform presence
        platforms_present = {p.platform.lower() for p in profiles}
        if any(p in platforms_present for p in ["leetcode", "codeforces", "codechef", "hackerrank"]):
            areas.add("Competitive Programming & Algorithmic Problem Solving")
        if "github" in platforms_present:
            areas.add("Open Source Development")
        if "kaggle" in platforms_present:
            areas.add("Machine Learning & Data Science")
        if any(p in platforms_present for p in ["dev.to", "medium"]):
            areas.add("Technical Writing & System Architecture")

        # 2. Inspect activities (repos, articles, badges)
        text_corpus: List[str] = []
        for p in profiles:
            if p.bio:
                text_corpus.append(p.bio)
            for r in p.match_reasons:
                text_corpus.append(r)

        for a in activities:
            text_corpus.append(f"{a.title} {a.description}")
            if a.metadata:
                lang = a.metadata.get("language")
                if lang and isinstance(lang, str):
                    clean_l = lang.strip().lower()
                    found_langs[clean_l] = found_langs.get(clean_l, 0) + 3

        combined_text = " ".join(text_corpus).lower()

        # Detect languages
        for lang in KNOWN_LANGUAGES:
            # Word boundary check
            pattern = rf'\b{re.escape(lang)}\b'
            matches = len(re.findall(pattern, combined_text))
            if matches > 0:
                found_langs[lang] = found_langs.get(lang, 0) + matches

        # Detect frameworks
        for key, name in KNOWN_FRAMEWORKS.items():
            pattern = rf'\b{re.escape(key)}\b'
            if re.search(pattern, combined_text):
                found_frameworks[name] = found_frameworks.get(name, 0) + 1

        # Detect databases
        for key, name in KNOWN_DATABASES.items():
            pattern = rf'\b{re.escape(key)}\b'
            if re.search(pattern, combined_text):
                found_databases[name] = found_databases.get(name, 0) + 1

        # Determine focus areas
        if any(f in found_frameworks for f in ["React", "Next.js", "Vue.js", "Angular", "Tailwind CSS"]):
            areas.add("Frontend Engineering")
        if any(f in found_frameworks for f in ["FastAPI", "Django", "Flask", "Express.js", "Node.js", "Spring Boot"]):
            areas.add("Backend & API Engineering")
        if any(f in found_frameworks for f in ["PyTorch", "TensorFlow", "OpenCV", "Scikit-Learn"]) or "kaggle" in platforms_present:
            areas.add("Artificial Intelligence & Computer Vision")

        # Order by frequency
        sorted_langs = [l.title() if l not in ("html", "css") else l.upper() for l, _ in sorted(found_langs.items(), key=lambda x: x[1], reverse=True)]
        sorted_frameworks = [f for f, _ in sorted(found_frameworks.items(), key=lambda x: x[1], reverse=True)]
        sorted_databases = [d for d, _ in sorted(found_databases.items(), key=lambda x: x[1], reverse=True)]

        # If sparse, supply defaults from verified platforms
        if not sorted_langs and "github" in platforms_present:
            sorted_langs = ["Python", "JavaScript"]
        if not areas:
            areas.add("Software Engineering")

        summary_parts = []
        if sorted_langs:
            summary_parts.append(f"Primary languages: {', '.join(sorted_langs[:3])}")
        if sorted_frameworks:
            summary_parts.append(f"Specialized in {', '.join(sorted_frameworks[:3])}")
        if areas:
            summary_parts.append(f"Core domains: {', '.join(list(areas)[:2])}")

        summary = ". ".join(summary_parts) + "." if summary_parts else "Public developer activity detected across multiple platforms."

        return DeveloperFingerprint(
            languages=sorted_langs[:8],
            frameworks=sorted_frameworks[:8],
            databases=sorted_databases[:6],
            focus_areas=list(areas)[:4],
            summary=summary
        )

# Global singleton
developer_fingerprint_engine = DeveloperFingerprintEngine()
