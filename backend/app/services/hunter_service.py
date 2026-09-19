import os
import logging
import httpx
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class HunterService:
    """
    Hunter.io B2B Intelligence Service:
    Pulls real verified domain patterns, executive decision-makers, and business emails.
    """

    def __init__(self):
        self.api_key = os.getenv("HUNTER_API_KEY", "").strip()
        self.base_url = "https://api.hunter.io/v2"

    async def search_domain(self, domain: str) -> Optional[Dict[str, Any]]:
        """
        Queries Hunter.io Domain Search for real corporate intelligence.
        """
        api_key = os.getenv("HUNTER_API_KEY", self.api_key)
        if not api_key:
            return None

        # Clean domain
        clean_domain = domain.replace("https://", "").replace("http://", "").split("/")[0].strip()
        if not clean_domain or "." not in clean_domain:
            return None

        url = f"{self.base_url}/domain-search"
        params = {
            "domain": clean_domain,
            "api_key": api_key,
            "limit": 10
        }

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(url, params=params)
                if res.status_code != 200:
                    logger.warning(f"[HunterService] Hunter API returned status {res.status_code} for {clean_domain}")
                    return None

                payload = res.json()
                data = payload.get("data", {})
                if not data:
                    return None

                emails = data.get("emails", [])
                organization = data.get("organization") or clean_domain.split(".")[0].capitalize()
                pattern = data.get("pattern", "{first}.{last}")

                # Find the best target buyer / decision maker
                best_contact = None
                
                # Priority 1: Sales, Executive, or Decision Maker
                for em in emails:
                    is_decision_maker = em.get("decision_maker") is True
                    dep = (em.get("department") or "").lower()
                    pos = (em.get("position") or "").lower()
                    
                    if is_decision_maker or any(kw in pos for kw in ["sales", "revenue", "gtm", "commercial", "founder", "ceo", "cro", "vp", "head"]):
                        best_contact = em
                        break

                # Priority 2: Take highest confidence contact if no specific sales role
                if not best_contact and emails:
                    best_contact = max(emails, key=lambda x: x.get("confidence", 0))

                contact_info = None
                if best_contact:
                    first = best_contact.get("first_name", "")
                    last = best_contact.get("last_name", "")
                    full_name = f"{first} {last}".strip() or "Key Decision Maker"
                    contact_info = {
                        "name": full_name,
                        "email": best_contact.get("value"),
                        "position": best_contact.get("position") or "Executive Leader",
                        "department": best_contact.get("department"),
                        "confidence": best_contact.get("confidence", 85),
                        "linkedin": best_contact.get("linkedin"),
                        "verification_status": best_contact.get("verification", {}).get("status", "valid")
                    }

                return {
                    "source": "Hunter.io Verified Intelligence",
                    "company_name": organization,
                    "domain": clean_domain,
                    "email_pattern": pattern,
                    "total_emails_found": len(emails),
                    "best_contact": contact_info,
                    "all_contacts": [
                        {
                            "name": f"{e.get('first_name', '')} {e.get('last_name', '')}".strip(),
                            "position": e.get("position"),
                            "email": e.get("value"),
                            "confidence": e.get("confidence")
                        }
                        for e in emails[:5]
                    ]
                }

        except Exception as e:
            logger.error(f"[HunterService] Error querying Hunter.io for {clean_domain}: {e}")
            return None

hunter_service = HunterService()
