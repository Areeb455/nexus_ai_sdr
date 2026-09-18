def test_agent_pipeline_execution(auth_client):
    # 1. Create a Lead
    create_res = auth_client.post("/api/v1/leads", json={
        "company_name": "Apex Cloud Systems",
        "contact_name": "Marcus Vance",
        "contact_email": "m.vance@apexcloud.io",
        "role": "VP of Revenue Operations",
        "website": "https://apexcloud.io",
        "industry": "B2B SaaS",
        "company_size": "250 employees",
        "location": "Seattle, WA",
        "notes": "Looking to streamline SDR workflows"
    })
    assert create_res.status_code == 201
    lead_id = create_res.json()["id"]

    # 2. Test Research Agent Endpoint
    research_res = auth_client.post(f"/api/v1/leads/{lead_id}/research")
    assert research_res.status_code == 200
    r_data = research_res.json()
    assert "summary" in r_data
    assert len(r_data["target_pain_points"]) > 0
    assert r_data["confidence_score"] > 0

    # 3. Test Qualification Agent Endpoint
    qual_res = auth_client.post(f"/api/v1/leads/{lead_id}/qualify")
    assert qual_res.status_code == 200
    q_data = qual_res.json()
    assert 0 <= q_data["score"] <= 100
    assert q_data["fit_category"] in ["HIGH_FIT", "MEDIUM_FIT", "LOW_FIT"]
    assert len(q_data["positive_signals"]) > 0

    # 4. Test Email Agent Endpoint
    email_res = auth_client.post(f"/api/v1/leads/{lead_id}/email")
    assert email_res.status_code == 200
    e_data = email_res.json()
    assert "subject" in e_data
    assert "body" in e_data
    assert len(e_data["body"]) > 50
    assert "personalization_rationale" in e_data

    # 5. Verify Lead Record updated with latest outputs
    lead_res = auth_client.get(f"/api/v1/leads/{lead_id}")
    assert lead_res.status_code == 200
    lead_data = lead_res.json()
    assert lead_data["latest_research"] is not None
    assert lead_data["latest_qualification"] is not None
    assert lead_data["latest_email"] is not None

def test_full_pipeline_endpoint(auth_client):
    create_res = auth_client.post("/api/v1/leads", json={
        "company_name": "Toby Freelance Graphics",
        "contact_name": "Toby Flenderson",
        "contact_email": "toby@tobyfreelance.org",
        "role": "Solo Designer",
        "industry": "Graphic Design",
        "company_size": "1 employee"
    })
    lead_id = create_res.json()["id"]

    pipe_res = auth_client.post(f"/api/v1/leads/{lead_id}/pipeline")
    assert pipe_res.status_code == 200
    p_data = pipe_res.json()
    assert p_data["status"] in ["QUALIFIED", "DISQUALIFIED"]
    assert p_data["qualification"]["score"] < 50
    assert p_data["qualification"]["fit_category"] == "LOW_FIT"
