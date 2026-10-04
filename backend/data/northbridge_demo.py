from random import Random

rng = Random(42)

PROGRAMS = [
    "Computer Science",
    "Business Administration",
    "Cybersecurity",
    "Data Science",
    "Software Engineering",
    "Information Technology",
    "AI & Machine Learning",
    "Finance",
    "Marketing",
    "Psychology",
]

COURSES_BY_PROGRAM = {
    "Computer Science": ["CS101", "CS201", "CS310", "CS420", "MATH210"],
    "Business Administration": ["BUS101", "MGT220", "ACC201", "FIN301", "MKT210"],
    "Cybersecurity": ["CYB101", "NET210", "SEC320", "FOR410", "CS201"],
    "Data Science": ["DS101", "STAT220", "ML310", "DB240", "PY201"],
    "Software Engineering": ["SE101", "SE220", "CS201", "DB240", "WEB310"],
    "Information Technology": ["IT101", "NET210", "DB240", "CLOUD330", "SEC320"],
    "AI & Machine Learning": ["AI101", "ML310", "PY201", "STAT220", "DS101"],
    "Finance": ["FIN101", "ACC201", "ECON210", "FIN301", "BUS101"],
    "Marketing": ["MKT101", "MKT210", "BUS101", "DATA220", "COMM150"],
    "Psychology": ["PSY101", "PSY220", "STAT220", "COG310", "SOC120"],
}

FIRST_NAMES = [
    "Emma", "Liam", "Sophia", "Noah", "Olivia", "Aarav", "Mia", "Ethan", "Isabella", "Lucas",
    "Amelia", "Mason", "Harper", "Logan", "Evelyn", "James", "Abigail", "Benjamin", "Ella", "Henry",
    "Sofia", "Jack", "Grace", "Daniel", "Chloe", "Leo", "Nora", "William", "Riley", "Samuel",
]

LAST_NAMES = [
    "Wilson", "Carter", "Brown", "Smith", "Johnson", "Basnet", "Chen", "Patel", "Garcia", "Miller",
    "Davis", "Martinez", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Lee", "White", "Clark",
]

NORTHBRIDGE_ADVISORS = [
    {
        "advisor_id": f"A{i+1:03}",
        "name": name,
        "email": email,
        "program": PROGRAMS[i],
        "department": PROGRAMS[i],
    }
    for i, (name, email) in enumerate([
        ("Dr. Sarah Johnson", "sarah.johnson@northbridge.edu"),
        ("Prof. Michael Chen", "michael.chen@northbridge.edu"),
        ("Dr. Emily Carter", "emily.carter@northbridge.edu"),
        ("Dr. James Wilson", "james.wilson@northbridge.edu"),
        ("Prof. Priya Patel", "priya.patel@northbridge.edu"),
        ("Dr. David Miller", "david.miller@northbridge.edu"),
        ("Dr. Hannah Lee", "hannah.lee@northbridge.edu"),
        ("Prof. Robert Garcia", "robert.garcia@northbridge.edu"),
        ("Dr. Amanda Brown", "amanda.brown@northbridge.edu"),
        ("Dr. Kevin Thomas", "kevin.thomas@northbridge.edu"),
    ])
]

def risk_score_for(label):
    if label == "High Risk":
        return rng.randint(78, 96)
    if label == "Moderate Risk":
        return rng.randint(45, 74)
    return rng.randint(8, 39)

def recommendation_for(label):
    if label == "High Risk":
        return "Immediate advisor outreach, weekly check-ins, tutoring support, and attendance monitoring."
    if label == "Moderate Risk":
        return "Monitor engagement, recommend study support, and schedule optional advisor follow-up."
    return "Student is progressing well. Continue regular academic engagement."

def build_demo_students():
    students = []

    risk_labels = (
        ["High Risk"] * 30 +
        ["Moderate Risk"] * 420 +
        ["Low Risk"] * 250
    )

    rng.shuffle(risk_labels)

    for i in range(700):
        student_id = str(100001 + i)
        first = FIRST_NAMES[i % len(FIRST_NAMES)]
        last = LAST_NAMES[(i * 3) % len(LAST_NAMES)]
        name = f"{first} {last}"
        program = PROGRAMS[i % len(PROGRAMS)]
        advisor = NORTHBRIDGE_ADVISORS[i % len(NORTHBRIDGE_ADVISORS)]

        overall_risk = risk_labels[i]
        overall_score = risk_score_for(overall_risk)

        course_count = rng.randint(2, 5)
        courses = rng.sample(COURSES_BY_PROGRAM[program], course_count)

        course_predictions = []
        for course in courses:
            variation = rng.randint(-12, 12)
            course_score = max(1, min(99, overall_score + variation))

            if course_score >= 75:
                course_risk = "High Risk"
            elif course_score >= 40:
                course_risk = "Moderate Risk"
            else:
                course_risk = "Low Risk"

            course_predictions.append({
                "course_id": course,
                "course_name": course,
                "risk_label": course_risk,
                "risk_score": course_score,
                "attendance_rate": max(45, min(100, 100 - course_score + rng.randint(-5, 12))),
                "engagement_score": max(30, min(100, 100 - course_score + rng.randint(-8, 10))),
                "assessment_average": max(35, min(98, 100 - course_score + rng.randint(-6, 14))),
            })

        students.append({
            "student_id": student_id,
            "name": name,
            "email": f"{first.lower()}.{last.lower()}{student_id}@northbridge.edu",
            "password": "123456",
            "program": program,
            "major": program,
            "year": rng.choice(["Freshman", "Sophomore", "Junior", "Senior"]),
            "advisor_id": advisor["advisor_id"],
            "advisor_name": advisor["name"],
            "advisor_email": advisor["email"],
            "overall_prediction": overall_risk,
            "overall_risk": overall_risk,
            "risk_label": overall_risk,
            "risk_score": overall_score,
            "recommendation": recommendation_for(overall_risk),
            "courses": course_predictions,
        })

    return students

NORTHBRIDGE_STUDENTS = build_demo_students()

NORTHBRIDGE_SUMMARY = {
    "university": "Northbridge University",

    "total_students": 700,
    "students": 700,
    "student_count": 700,

    "total_advisors": 10,
    "advisors": 10,
    "advisor_count": 10,

    "high_risk": 30,
    "highRisk": 30,
    "at_risk_students": 30,
    "atRiskStudents": 30,

    "moderate_risk": 420,
    "moderateRisk": 420,

    "low_risk": 250,
    "lowRisk": 250,

    "total_predictions": 700,
    "predictions": 700,
    "prediction_count": 700,

    "pending_uploads": 0,
    "pendingUploads": 0,

    "active_term": "Spring 2026",
    "activeTerm": "Spring 2026",
}

def get_demo_students():
    return NORTHBRIDGE_STUDENTS

def get_demo_advisors():
    advisors = []

    for advisor in NORTHBRIDGE_ADVISORS:
        assigned = [
            s for s in NORTHBRIDGE_STUDENTS
            if s["advisor_id"] == advisor["advisor_id"]
        ]

        advisors.append({
            **advisor,
            "assigned_students": len(assigned),
            "high_risk": sum(1 for s in assigned if s["overall_risk"] == "High Risk"),
            "moderate_risk": sum(1 for s in assigned if s["overall_risk"] == "Moderate Risk"),
            "low_risk": sum(1 for s in assigned if s["overall_risk"] == "Low Risk"),
        })

    return advisors

def get_demo_summary():
    return NORTHBRIDGE_SUMMARY

def get_student_by_id(student_id: str):
    return next(
        (s for s in NORTHBRIDGE_STUDENTS if str(s["student_id"]) == str(student_id)),
        None
    )

def get_advisor_by_email(email: str):
    return next(
        (a for a in get_demo_advisors() if a["email"].lower() == email.lower()),
        None
    )

def get_students_for_advisor(email: str):
    advisor = get_advisor_by_email(email)

    if not advisor:
        return []

    return [
        s for s in NORTHBRIDGE_STUDENTS
        if s["advisor_id"] == advisor["advisor_id"]
    ]