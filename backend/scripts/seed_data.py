import asyncio
import os
import sys

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal, Base, engine
from app.db.models import User, Lead, LeadStatus
from app.core.security import get_password_hash
from app.agents.orchestrator import orchestrator

async def seed():
    print("[Seed] Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Create or get Demo User
        demo_email = "demo@nexus.ai"
        user = db.query(User).filter(User.email == demo_email).first()
        if not user:
            print("[Seed] Creating default demo user: demo@nexus.ai / password123")
            user = User(
                email=demo_email,
                hashed_password=get_password_hash("password123"),
                full_name="Alex Rivera (Nexus SDR)"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            print("[Seed] Demo user already exists.")

        # 2. Check if leads exist
        existing_leads_count = db.query(Lead).count()
        if existing_leads_count > 0:
            print(f"[Seed] Database already contains {existing_leads_count} leads. Skipping duplicate seed.")
            return

        print("[Seed] Seeding 5 representative B2B prospects across diverse ICP tiers...")

        sample_leads = [
            {
                "company_name": "CloudScale Data",
                "contact_name": "Elena Rostova",
                "contact_email": "elena.rostova@cloudscaledata.io",
                "role": "VP of Revenue Operations",
                "website": "https://cloudscaledata.io",
                "industry": "B2B SaaS / Data Infrastructure",
                "company_size": "180 employees",
                "location": "San Francisco, CA",
                "notes": "Fast-growing Series B data observability platform. Recently hired 12 outbound SDRs and experiencing high ramp friction.",
                "auto_run_pipeline": True
            },
            {
                "company_name": "FinEdge Technologies",
                "contact_name": "Sarah Chen",
                "contact_email": "schen@finedgetechnologies.com",
                "role": "Chief Commercial Officer",
                "website": "https://finedgetechnologies.com",
                "industry": "Fintech / Global Payments",
                "company_size": "320 employees",
                "location": "New York, NY",
                "notes": "Expanding international enterprise B2B sales pipeline. Seeking automated qualification for inbound enterprise leads.",
                "auto_run_pipeline": False
            },
            {
                "company_name": "Apex Global Freight",
                "contact_name": "Marcus Vance",
                "contact_email": "m.vance@apexfreightlogistics.com",
                "role": "Director of Commercial Logistics",
                "website": "https://apexfreightlogistics.com",
                "industry": "Logistics & Supply Chain",
                "company_size": "450 employees",
                "location": "Chicago, IL",
                "notes": "Mid-market freight brokerage. Heavily dependent on manual phone and email outreach with low SDR response rates.",
                "auto_run_pipeline": True
            },
            {
                "company_name": "Synapse BioAnalytics",
                "contact_name": "Dr. Aris Thorne",
                "contact_email": "athorne@synapsebio.ai",
                "role": "Founder & CEO",
                "website": "https://synapsebio.ai",
                "industry": "Healthcare AI / Biotechnology",
                "company_size": "45 employees",
                "location": "Boston, MA",
                "notes": "Clinical trial analytics software. Lean executive team looking to scale enterprise pharmaceutical outreach.",
                "auto_run_pipeline": False
            },
            {
                "company_name": "Toby Designs Studio",
                "contact_name": "Toby Flenderson",
                "contact_email": "toby@tobydesignsstudio.net",
                "role": "Freelance Brand Designer",
                "website": "https://tobydesignsstudio.net",
                "industry": "Graphic Design / Freelance",
                "company_size": "1 employee",
                "location": "Austin, TX",
                "notes": "Independent solopreneur designing logos and Squarespace templates. No sales team or B2B outbound motion.",
                "auto_run_pipeline": True
            }
        ]

        for item in sample_leads:
            auto_run = item.pop("auto_run_pipeline")
            lead = Lead(user_id=user.id, **item)
            db.add(lead)
            db.commit()
            db.refresh(lead)
            print(f"  [+] Created Lead #{lead.id}: {lead.contact_name} ({lead.company_name})")

            if auto_run:
                print(f"      -> Running Multi-Agent Pipeline for Lead #{lead.id}...")
                await orchestrator.run_full_pipeline(lead, db, user_id=user.id)
                print(f"      -> Completed! Status: {lead.status}")

        print("\n[Seed] Successfully finished seeding demo database!")
        print("Default Demo Credentials: demo@nexus.ai / password123")

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(seed())
