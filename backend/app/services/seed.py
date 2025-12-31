from sqlalchemy.orm import Session
from ..models import User, Location, Probe, Target, AlertRule
from ..models.target import TargetType
from ..models.alert_rule import RuleType, Severity
from ..core.auth import get_password_hash
from ..core.config import settings


def seed_database(db: Session):
    """Seed initial data - idempotent"""

    # Create admin user
    admin = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
    if not admin:
        admin = User(
            username=settings.ADMIN_USERNAME,
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            is_active=True
        )
        db.add(admin)
        print(f"✓ Created admin user: {settings.ADMIN_USERNAME}")

    # Create locations
    locations_data = [
        {"name": "São Paulo - BR", "code": "sp-br"},
        {"name": "Manaus - BR", "code": "mao-br"},
        {"name": "Frankfurt - DE", "code": "fra-de"},
    ]

    for loc_data in locations_data:
        loc = db.query(Location).filter(Location.code == loc_data["code"]).first()
        if not loc:
            loc = Location(**loc_data)
            db.add(loc)
            print(f"✓ Created location: {loc_data['name']}")

    db.commit()

    # Create probes
    probes_data = [
        {"name": "Probe SP", "location_code": "sp-br", "token": settings.PROBE_SP_TOKEN},
        {"name": "Probe Manaus", "location_code": "mao-br", "token": settings.PROBE_MAO_TOKEN},
        {"name": "Probe Frankfurt", "location_code": "fra-de", "token": settings.PROBE_FRA_TOKEN},
    ]

    for probe_data in probes_data:
        location = db.query(Location).filter(Location.code == probe_data["location_code"]).first()
        if location:
            probe = db.query(Probe).filter(Probe.token == probe_data["token"]).first()
            if not probe:
                probe = Probe(
                    name=probe_data["name"],
                    location_id=location.id,
                    token=probe_data["token"],
                    is_active=True
                )
                db.add(probe)
                print(f"✓ Created probe: {probe_data['name']}")

    db.commit()

    # Create targets - Top 10 active by default
    targets_data = [
        # Principais (Ativos por padrão)
        {"name": "Globo", "url": "https://globo.com", "is_active": True},
        {"name": "UOL", "url": "https://uol.com.br", "is_active": True},
        {"name": "Mercado Livre", "url": "https://mercadolivre.com.br", "is_active": True},
        {"name": "Gov.br", "url": "https://gov.br", "is_active": True},
        {"name": "Reclame Aqui", "url": "https://reclameaqui.com.br", "is_active": True},
        {"name": "Google", "url": "https://google.com", "is_active": True},
        {"name": "YouTube", "url": "https://youtube.com", "is_active": True},
        {"name": "Facebook", "url": "https://facebook.com", "is_active": True},
        {"name": "Instagram", "url": "https://instagram.com", "is_active": True},
        {"name": "Wikipedia", "url": "https://wikipedia.org", "is_active": True},

        # Plataformas Nacionais (Inativas - disponíveis para ativação)
        {"name": "Estadão", "url": "https://estadao.com.br", "is_active": False},
        {"name": "Folha de S.Paulo", "url": "https://folha.uol.com.br", "is_active": False},
        {"name": "G1", "url": "https://g1.globo.com", "is_active": False},
        {"name": "Terra", "url": "https://terra.com.br", "is_active": False},
        {"name": "R7", "url": "https://r7.com", "is_active": False},
        {"name": "iG", "url": "https://ig.com.br", "is_active": False},
        {"name": "Bradesco", "url": "https://bradesco.com.br", "is_active": False},
        {"name": "Itaú", "url": "https://itau.com.br", "is_active": False},
        {"name": "Banco do Brasil", "url": "https://bb.com.br", "is_active": False},
        {"name": "Caixa", "url": "https://caixa.gov.br", "is_active": False},
        {"name": "Americanas", "url": "https://americanas.com.br", "is_active": False},
        {"name": "Magazine Luiza", "url": "https://magazineluiza.com.br", "is_active": False},
        {"name": "Submarino", "url": "https://submarino.com.br", "is_active": False},
        {"name": "Casas Bahia", "url": "https://casasbahia.com.br", "is_active": False},
        {"name": "OLX", "url": "https://olx.com.br", "is_active": False},

        # Plataformas Internacionais (Inativas - disponíveis para ativação)
        {"name": "Amazon", "url": "https://amazon.com", "is_active": False},
        {"name": "Twitter/X", "url": "https://twitter.com", "is_active": False},
        {"name": "LinkedIn", "url": "https://linkedin.com", "is_active": False},
        {"name": "Reddit", "url": "https://reddit.com", "is_active": False},
        {"name": "Netflix", "url": "https://netflix.com", "is_active": False},
        {"name": "Spotify", "url": "https://spotify.com", "is_active": False},
        {"name": "GitHub", "url": "https://github.com", "is_active": False},
        {"name": "Stack Overflow", "url": "https://stackoverflow.com", "is_active": False},
        {"name": "Microsoft", "url": "https://microsoft.com", "is_active": False},
        {"name": "Apple", "url": "https://apple.com", "is_active": False},
        {"name": "CloudFlare", "url": "https://cloudflare.com", "is_active": False},
        {"name": "DigitalOcean", "url": "https://digitalocean.com", "is_active": False},
        {"name": "AWS", "url": "https://aws.amazon.com", "is_active": False},
        {"name": "Dropbox", "url": "https://dropbox.com", "is_active": False},
        {"name": "Twitch", "url": "https://twitch.tv", "is_active": False},
    ]

    for target_data in targets_data:
        target = db.query(Target).filter(Target.url == target_data["url"]).first()
        if not target:
            target = Target(
                name=target_data["name"],
                url=target_data["url"],
                type=TargetType.HTTPS,
                is_active=target_data["is_active"]
            )
            db.add(target)
            status = "✓" if target_data["is_active"] else "○"
            print(f"{status} Created target: {target_data['name']}")

    db.commit()

    # Create alert rules
    rules_data = [
        {
            "name": "DOWN - 3 consecutive failures",
            "rule_type": RuleType.DOWN,
            "severity": Severity.CRITICAL,
            "consecutive_failures": 3
        },
        {
            "name": "Loss >= 2% (MAJOR)",
            "rule_type": RuleType.LOSS,
            "severity": Severity.MAJOR,
            "threshold": 2.0
        },
        {
            "name": "Loss >= 5% (CRITICAL)",
            "rule_type": RuleType.LOSS,
            "severity": Severity.CRITICAL,
            "threshold": 5.0
        },
        {
            "name": "RTT P95 > 120ms",
            "rule_type": RuleType.RTT_P95,
            "severity": Severity.MAJOR,
            "threshold": 120.0
        },
        {
            "name": "Jitter > 20ms",
            "rule_type": RuleType.JITTER,
            "severity": Severity.MAJOR,
            "threshold": 20.0
        },
        {
            "name": "HTTP 5xx rate > 2%",
            "rule_type": RuleType.HTTP_5XX,
            "severity": Severity.MAJOR,
            "threshold": 2.0
        },
    ]

    for rule_data in rules_data:
        rule = db.query(AlertRule).filter(AlertRule.name == rule_data["name"]).first()
        if not rule:
            rule = AlertRule(**rule_data, is_active=True)
            db.add(rule)
            print(f"✓ Created alert rule: {rule_data['name']}")

    db.commit()
    print("✓ Database seeding completed")
