from typing import List, Dict, Any
from app.models.schemas import ActivityItem

class FootprintAggregator:
    """
    Consolidates digital activities, technical contributions, hackathons,
    publications, and patents into structured chronological intelligence.
    """

    @staticmethod
    def categorize_activities(raw_activities: List[Dict[str, Any]]) -> Dict[str, List[ActivityItem]]:
        categorized = {
            "Repositories": [],
            "Hackathons": [],
            "Conferences": [],
            "Publications": [],
            "Patents": [],
            "Career": [],
            "Education": []
        }

        for item in raw_activities:
            cat = item.get("category", "Repositories")
            activity = ActivityItem(
                id=item.get("id", f"act_{len(categorized.get(cat, [])) + 1}"),
                category=cat,
                title=item.get("title", "Untitled Activity"),
                description=item.get("description", ""),
                organization=item.get("organization"),
                date=item.get("date", "2025"),
                source_url=item.get("source_url", "https://github.com"),
                source_platform=item.get("source_platform", "Web"),
                confidence=item.get("confidence", 0.90),
                metadata=item.get("metadata", {})
            )
            if cat in categorized:
                categorized[cat].append(activity)
            else:
                categorized["Repositories"].append(activity)

        return categorized

    @staticmethod
    def build_chronological_timeline(activities: List[ActivityItem]) -> List[ActivityItem]:
        """Sorts all activities in chronological ascending order."""
        def parse_date(item: ActivityItem):
            d = item.date
            # Ensure sortable standard format
            parts = d.split("-")
            year = int(parts[0]) if parts[0].isdigit() else 2024
            month = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 1
            return (year, month)

        return sorted(activities, key=parse_date)
