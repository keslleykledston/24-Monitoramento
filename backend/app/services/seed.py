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

    # Create targets - Monitoramento padrão (HTTP + ICMP)
    targets_data = [
        # ========== BANCOS BRASILEIROS (Ativos por padrão) ==========
        {"name": "Banco do Brasil", "url": "https://bb.com.br", "is_active": True},
        {"name": "Caixa Econômica Federal", "url": "https://caixa.gov.br", "is_active": True},
        {"name": "Itaú Unibanco", "url": "https://itau.com.br", "is_active": True},
        {"name": "Bradesco", "url": "https://bradesco.com.br", "is_active": True},
        {"name": "Santander Brasil", "url": "https://santander.com.br", "is_active": True},
        {"name": "Nubank", "url": "https://nubank.com.br", "is_active": True},
        {"name": "Banco Inter", "url": "https://bancointer.com.br", "is_active": True},
        {"name": "BTG Pactual", "url": "https://btgpactual.com", "is_active": True},
        {"name": "Banco Safra", "url": "https://safra.com.br", "is_active": True},
        {"name": "Sicoob", "url": "https://sicoob.com.br", "is_active": True},
        {"name": "Sicredi", "url": "https://sicredi.com.br", "is_active": True},
        {"name": "C6 Bank", "url": "https://c6bank.com.br", "is_active": True},
        {"name": "Original", "url": "https://original.com.br", "is_active": True},
        {"name": "PagSeguro", "url": "https://pagseguro.uol.com.br", "is_active": True},
        {"name": "PicPay", "url": "https://picpay.com", "is_active": True},

        # ========== REDES SOCIAIS E STREAMING (Ativos por padrão) ==========
        {"name": "Facebook", "url": "https://facebook.com", "is_active": True},
        {"name": "Instagram", "url": "https://instagram.com", "is_active": True},
        {"name": "Twitter/X", "url": "https://twitter.com", "is_active": True},
        {"name": "LinkedIn", "url": "https://linkedin.com", "is_active": True},
        {"name": "TikTok", "url": "https://tiktok.com", "is_active": True},
        {"name": "YouTube", "url": "https://youtube.com", "is_active": True},
        {"name": "WhatsApp Web", "url": "https://web.whatsapp.com", "is_active": True},
        {"name": "Telegram Web", "url": "https://web.telegram.org", "is_active": True},
        {"name": "Discord", "url": "https://discord.com", "is_active": True},
        {"name": "Reddit", "url": "https://reddit.com", "is_active": True},
        {"name": "Netflix", "url": "https://netflix.com", "is_active": True},
        {"name": "Spotify", "url": "https://spotify.com", "is_active": True},
        {"name": "Amazon Prime Video", "url": "https://primevideo.com", "is_active": True},
        {"name": "Disney+", "url": "https://disneyplus.com", "is_active": True},
        {"name": "HBO Max", "url": "https://max.com", "is_active": True},
        {"name": "Twitch", "url": "https://twitch.tv", "is_active": True},
        {"name": "Globoplay", "url": "https://globoplay.globo.com", "is_active": True},

        # ========== PLATAFORMAS DE JOGOS (Ativos por padrão) ==========
        {"name": "Steam", "url": "https://store.steampowered.com", "is_active": True},
        {"name": "Epic Games", "url": "https://epicgames.com", "is_active": True},
        {"name": "Riot Games", "url": "https://riotgames.com", "is_active": True},
        {"name": "League of Legends", "url": "https://leagueoflegends.com", "is_active": True},
        {"name": "Valorant", "url": "https://playvalorant.com", "is_active": True},
        {"name": "Blizzard Battle.net", "url": "https://blizzard.com", "is_active": True},
        {"name": "EA Games", "url": "https://ea.com", "is_active": True},
        {"name": "PlayStation Network", "url": "https://playstation.com", "is_active": True},
        {"name": "Xbox Live", "url": "https://xbox.com", "is_active": True},
        {"name": "Nintendo", "url": "https://nintendo.com", "is_active": True},
        {"name": "Garena", "url": "https://garena.com.br", "is_active": True},
        {"name": "Ubisoft", "url": "https://ubisoft.com", "is_active": True},
        {"name": "Rockstar Games", "url": "https://rockstargames.com", "is_active": True},
        {"name": "GOG", "url": "https://gog.com", "is_active": True},

        # ========== SITES GOVERNAMENTAIS E RECEITA FEDERAL (Ativos por padrão) ==========
        {"name": "Gov.br - Portal do Governo", "url": "https://gov.br", "is_active": True},
        {"name": "Receita Federal", "url": "https://receita.fazenda.gov.br", "is_active": True},
        {"name": "e-CAC - Receita Federal", "url": "https://cav.receita.fazenda.gov.br", "is_active": True},
        {"name": "Portal da Transparência", "url": "https://portaltransparencia.gov.br", "is_active": True},
        {"name": "Meu INSS", "url": "https://meu.inss.gov.br", "is_active": True},
        {"name": "eSocial", "url": "https://esocial.gov.br", "is_active": True},
        {"name": "FGTS", "url": "https://fgts.caixa.gov.br", "is_active": True},
        {"name": "CNH Digital", "url": "https://portalservicos.denatran.serpro.gov.br", "is_active": True},
        {"name": "TSE - Tribunal Superior Eleitoral", "url": "https://tse.jus.br", "is_active": True},
        {"name": "CNJ - Conselho Nacional de Justiça", "url": "https://cnj.jus.br", "is_active": True},
        {"name": "DETRAN", "url": "https://www.gov.br/pt-br/servicos/obter-cnh", "is_active": True},
        {"name": "Consulta CPF", "url": "https://servicos.receita.fazenda.gov.br", "is_active": True},

        # ========== OUTRAS PLATAFORMAS IMPORTANTES (Ativos) ==========
        {"name": "Google", "url": "https://google.com", "is_active": True},
        {"name": "Globo.com", "url": "https://globo.com", "is_active": True},
        {"name": "UOL", "url": "https://uol.com.br", "is_active": True},
        {"name": "Mercado Livre", "url": "https://mercadolivre.com.br", "is_active": True},
        {"name": "Amazon Brasil", "url": "https://amazon.com.br", "is_active": True},
        {"name": "Americanas", "url": "https://americanas.com.br", "is_active": True},
        {"name": "Magazine Luiza", "url": "https://magazineluiza.com.br", "is_active": True},
        {"name": "Casas Bahia", "url": "https://casasbahia.com.br", "is_active": True},

        # ========== PLATAFORMAS TÉCNICAS E DESENVOLVIMENTO (Inativas - disponíveis para ativação) ==========
        {"name": "GitHub", "url": "https://github.com", "is_active": False},
        {"name": "Stack Overflow", "url": "https://stackoverflow.com", "is_active": False},
        {"name": "GitLab", "url": "https://gitlab.com", "is_active": False},
        {"name": "Docker Hub", "url": "https://hub.docker.com", "is_active": False},
        {"name": "NPM", "url": "https://npmjs.com", "is_active": False},

        # ========== CLOUD PROVIDERS (Inativas - disponíveis para ativação) ==========
        {"name": "AWS", "url": "https://aws.amazon.com", "is_active": False},
        {"name": "Google Cloud", "url": "https://cloud.google.com", "is_active": False},
        {"name": "Microsoft Azure", "url": "https://azure.microsoft.com", "is_active": False},
        {"name": "DigitalOcean", "url": "https://digitalocean.com", "is_active": False},
        {"name": "CloudFlare", "url": "https://cloudflare.com", "is_active": False},
        {"name": "Heroku", "url": "https://heroku.com", "is_active": False},

        # ========== NOTÍCIAS E MÍDIA (Inativas - disponíveis para ativação) ==========
        {"name": "Estadão", "url": "https://estadao.com.br", "is_active": False},
        {"name": "Folha de S.Paulo", "url": "https://folha.uol.com.br", "is_active": False},
        {"name": "G1", "url": "https://g1.globo.com", "is_active": False},
        {"name": "CNN Brasil", "url": "https://cnnbrasil.com.br", "is_active": False},
        {"name": "R7", "url": "https://r7.com", "is_active": False},
        {"name": "Terra", "url": "https://terra.com.br", "is_active": False},
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
