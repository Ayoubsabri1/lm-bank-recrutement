const jobOffers = [
    {
        id: 1,
        title: "Chargé(e) de Recouvrement GC - Contentieux",
        date: "19-12-2025",
        direction: "CHARGÉ(E) DE RECOUVREMENT GRANDS COMPTES - CONTENTIEUX",
        contract: "CDI",
        location: "Casablanca",
        function: "Chargé du recouvrement",
        context: "Rattaché(e) à la Direction Du Recouvrement Grands Comptes, vous aurez pour mission de :",
        missions: [
            "Contribuer au recouvrement opérationnel forcé des affaires gérées, parachever l'ensemble des procédures judiciaires.",
            "Assurer le rôle de prévenir et de maîtriser le risque de responsabilité pour rupture abusive du contrat de crédit.",
            "Assurer la gestion judiciaire des dossiers contentieux de LM Bank.",
            "Assurer le suivi du patrimoine et les garanties des clients débiteurs.",
            "Assurer la gestion de la relation avec les avocats.",
            "Contribuer à la prévision du risque fiscal et d'appel à la responsabilité LM Bank.",
            "Contribuer à l'étude des solutions des clients débiteurs."
        ],
        profile: "De formation supérieure Bac+5. Vous avez une première expérience dans un poste similaire."
    },
    {
        id: 2,
        title: "Conseiller Clientèle Particuliers",
        date: "20-12-2025",
        direction: "RESEAU D'AGENCES",
        contract: "CDI",
        location: "Rabat",
        function: "Conseiller clientèle",
        context: "Au sein de notre réseau d'agences, vous êtes le point d'entrée privilégié de nos clients particuliers.",
        missions: [
            "Accueillir et conseiller la clientèle sur les produits et services bancaires.",
            "Développer et fidéliser un portefeuille de clients particuliers.",
            "Traiter les opérations courantes et gérer les réclamations.",
            "Promouvoir les solutions digitales de la banque."
        ],
        profile: "Bac+3/5 en Commerce ou Gestion. Une première expérience commerciale est souhaitée."
    },
    {
        id: 3,
        title: "Analyste Risques Crédit",
        date: "21-12-2025",
        direction: "DIRECTION DES RISQUES",
        contract: "CDI",
        location: "Casablanca",
        function: "Analyste Risques",
        context: "Rattaché à la Direction des Risques, vous analysez la solvabilité des contreparties.",
        missions: [
            "Analyser les demandes de crédit entreprises et particuliers.",
            "Évaluer les risques financiers et recommander les décisions d'octroi.",
            "Surveiller l'évolution du portefeuille de crédits.",
            "Participer à la mise à jour des politiques de risques."
        ],
        profile: "Bac+5 en Finance ou Gestion des Risques. Maîtrise de l'analyse financière."
    },
    {
        id: 4,
        title: "Chef de Projet IT - Digital",
        date: "18-12-2025",
        direction: "SYSTEMES D'INFORMATION",
        contract: "CDI",
        location: "Casablanca",
        function: "Chef de projet",
        context: "Vous pilotez les projets de transformation digitale de la banque.",
        missions: [
            "Cadrer et piloter les projets d'applications mobiles et web.",
            "Coordonner les équipes techniques et métiers.",
            "Assurer le respect des délais et des budgets.",
            "Gérer la relation avec les prestataires externes."
        ],
        profile: "Ingénieur d'état en Informatique. Expérience de 3 ans minimum en gestion de projet."
    },
    {
        id: 5,
        title: "Auditeur Interne Senior",
        date: "15-12-2025",
        direction: "AUDIT GENERAL",
        contract: "CDI",
        location: "Casablanca",
        function: "Auditeur",
        context: "Vous évaluez l'efficacité du dispositif de contrôle interne.",
        missions: [
            "Réaliser des missions d'audit sur l'ensemble des activités de la banque.",
            "Identifier les zones de risques et proposer des recommandations.",
            "Rédiger les rapports d'audit.",
            "Suivre la mise en œuvre des recommandations."
        ],
        profile: "Bac+5 Audit/Contrôle de gestion. 4 à 5 ans d'expérience en audit bancaire."
    },
    {
        id: 6,
        title: "Responsable d'Agence",
        date: "22-12-2025",
        direction: "RESEAU D'AGENCES",
        contract: "CDI",
        location: "Tanger",
        function: "Responsable d'agence",
        context: "Vous pilotez l'activité commerciale et le fonctionnement de l'agence.",
        missions: [
            "Animer et manager l'équipe commerciale.",
            "Développer le fonds de commerce de l'agence.",
            "Gérer le risque opérationnel et le respect de la conformité.",
            "Représenter la banque au niveau local."
        ],
        profile: "Bac+5 avec une expérience confirmée de 5 ans dans le réseau bancaire."
    },
    {
        id: 7,
        title: "Chargé d'Affaires Entreprises",
        date: "20-12-2025",
        direction: "CENTRE D'AFFAIRES",
        contract: "CDI",
        location: "Marrakech",
        function: "Chargé d'affaires",
        context: "Vous gérez un portefeuille de clients PME/PMI.",
        missions: [
            "Accompagner les entreprises dans leurs projets de financement.",
            "Proposer des solutions de gestion de flux et de placement.",
            "Analyser la santé financière des entreprises clientes.",
            "Prospecter de nouveaux clients entreprises."
        ],
        profile: "Bac+5 Banque/Finance. Expérience commerciale B2B exigée."
    },
    {
        id: 8,
        title: "Administrateur Systèmes et Réseaux",
        date: "17-12-2025",
        direction: "PRODUCTION INFORMATIQUE",
        contract: "CDI",
        location: "Casablanca",
        function: "Administrateur IT",
        context: "Vous garantissez la disponibilité et la sécurité des infrastructures.",
        missions: [
            "Administrer les serveurs Linux/Windows et les équipements réseaux.",
            "Gérer les sauvegardes et la sécurité des données.",
            "Assurer le support technique niveau 2/3.",
            "Participer aux projets d'évolution de l'infrastructure."
        ],
        profile: "Bac+3/5 Informatique. Certifications Cisco/Microsoft appréciées."
    },
    {
        id: 9,
        title: "Chargé de Conformité",
        date: "19-12-2025",
        direction: "CONFORMITE",
        contract: "CDI",
        location: "Casablanca",
        function: "Compliance Officer",
        context: "Vous veillez au respect des réglementations bancaires.",
        missions: [
            "Contrôler le respect des procédures KYC et LAB/FT.",
            "Analyser les opérations suspectes.",
            "Former les collaborateurs aux normes de conformité.",
            "Assurer la veille réglementaire."
        ],
        profile: "Bac+5 Droit/Finance. Rigueur et intégrité."
    },
    {
        id: 10,
        title: "Développeur Full Stack Senior",
        date: "21-12-2025",
        direction: "DIGITAL FACTORY",
        contract: "CDI",
        location: "Casablanca",
        function: "Développeur",
        context: "Vous concevez les nouvelles applications de la banque.",
        missions: [
            "Développer des solutions web et mobiles (React/Node.js).",
            "Participer à l'architecture technique.",
            "Assurer la qualité du code et les tests unitaires.",
            "Mentorer les développeurs juniors."
        ],
        profile: "Ingénieur informatique. 5 ans d'expérience en développement web."
    },
    // Génération automatique des offres restantes pour atteindre 40+
    ...Array.from({ length: 30 }, (_, i) => ({
        id: 11 + i,
        title: [
            "Conseiller Clientèle",
            "Chargé de Compte",
            "Guichetier Payeur",
            "Commercial Terrain",
            "Data Analyst",
            "Ingénieur DevOps",
            "Développeur Mobile",
            "Chargé Marketing Digital"
        ][i % 8] + " - " + ["Agence Maârif", "Agence Agdal", "Agence Gueliz", "Agence Malabata", "Siège", "Agence Hay Riad", "Agence Hay Mohammadi"][i % 7],
        date: new Date(2025, 11, 15 + (i % 15)).toLocaleDateString('fr-FR').replace(/\//g, '-'),
        direction: i % 8 >= 4 ? "DIGITAL FACTORY" : "RESEAU D'AGENCES",
        contract: i % 5 === 0 ? "CDD" : i % 7 === 0 ? "Stage" : "CDI",
        // IT jobs (index 4-7) are in Casablanca, others distributed across cities
        location: i % 8 >= 4 ? "Casablanca" : ["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fès", "Meknès", "Oujda", "Kénitra", "Tétouan"][i % 10],
        function: i % 8 >= 4 ? "IT / Digital" : "Commercial",
        context: i % 8 >= 4
            ? "Au sein de notre Digital Factory, vous participez à la transformation digitale de la banque."
            : "Au sein d'une de nos agences, vous participez au développement commercial.",
        missions: i % 8 >= 4
            ? [
                "Développer et maintenir les applications.",
                "Participer aux projets d'innovation.",
                "Assurer la qualité du code.",
                "Collaborer avec les équipes métiers."
            ]
            : [
                "Accueillir les clients.",
                "Traiter les opérations de guichet.",
                "Proposer des produits simples.",
                "Assurer la qualité de service."
            ],
        profile: i % 8 >= 4
            ? "Bac+5 en Informatique avec expérience en développement."
            : "Bac+2/3 avec le sens du service client.",
        description: i % 8 >= 4
            ? "Poste IT basé à Casablanca - siège de notre Digital Factory"
            : "Poste commercial en agence"
    }))
];
