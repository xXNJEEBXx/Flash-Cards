// Cybersecurity flashcards data
export const cybersecurityCards = [
    {
        question: "Digital Signature (التوقيع الرقمي)",
        answer: "A mathematical technique used to validate the authenticity of a message, verifying it was sent by a particular sender. (إثبات مرسل وصحة رسالة.)"
    },
    {
        question: "Diffie-Hellman Key Exchange (تبادل مفاتيح ديفي-هيلمان)",
        answer: "An algorithm enabling two users to securely exchange a secret key over an insecure channel for later symmetric encryption (limited to key exchange). (تبادل مفتاح سري آمن.)"
    },
    {
        question: "Public Key Certificate (شهادة المفتاح العام)",
        answer: "A public-key signed by a trusted third party (Certificate Authority or CA) to guarantee the connection between the public key and an end entity (owner). (ضمان هوية مالك مفتاح عام.)"
    },
    {
        question: "Certificate Authority (CA) (سلطة التصديق)",
        answer: "A trusted third party that guarantees the connection between a public key and an end entity, ensuring authenticity and non-repudiation. (جهة موثوقة تصدر شهادات.)"
    },
    {
        question: "Public Key Infrastructure (PKI) (البنية التحتية للمفتاح العام)",
        answer: "The combination of software, encryption technologies, and services enabling secure communications and transactions, integrating digital certificates, public key cryptography, and CAs. (نظام إدارة مفاتيح وشهادات.)"
    },
    {
        question: "Public Key Cryptography (Asymmetric) (تشفير المفتاح العام (غير المتماثل))",
        answer: "Cryptography involving the use of two separate keys (a public key and a private key), as opposed to symmetric encryption which uses only one key. (تشفير بمفتاحين: عام وخاص.)"
    },
    {
        question: "Trap Door One-Way Function (دالة الباب الخلفي أحادية الاتجاه)",
        answer: "A function that is easy to compute in one direction but hard to compute in the reverse direction without special information (the trap door). (سهلة حسابها، صعبة عكسها.)"
    },
    {
        question: "RSA (Rivest-Shamir-Adelman) (خوارزمية RSA)",
        answer: "A widely used public-key block cipher algorithm providing confidentiality and digital signatures, whose security is based on the difficulty of integer factorization. (تشفير مفتاح عام (تحليل أعداد).)"
    },
    {
        question: "Message Authentication (مصادقة الرسائل)",
        answer: "The process concerned with protecting message integrity, validating originator identity, and ensuring non-repudiation of origin. (تأكيد سلامة ومصدر الرسالة.)"
    },
    {
        question: "Message Authentication Code (MAC) (رمز مصادقة الرسالة)",
        answer: "A small block of data, generated using a secret key and appended to a message, used to verify the message's integrity and authenticity. (رمز لسلامة وأصالة الرسالة (بمفتاح).)"
    },
    {
        question: "Hash Function (One-Way) (دالة الهاش (أحادية الاتجاه))",
        answer: "A function that accepts a variable-size message input and produces a fixed-size message digest output, primarily used for integrity checks (does not use a secret key like MAC). (بصمة فريدة للرسالة (للسلامة).)"
    },
    {
        question: "Hash Function Requirements (One-way, Collision-free) (متطلبات دالة الهاش (أحادية الاتجاه، خالية من التصادم))",
        answer: "Key properties of cryptographic hash functions: One-way (hard to invert), Collision-free (hard to find two inputs with the same output). (صعبة العكس، بلا تصادم.)"
    },
    {
        question: "S/MIME (Secure/Multipurpose Internet Mail Extensions) (امتدادات بريد الإنترنت الآمنة/متعددة الأغراض)",
        answer: "A widely accepted protocol for sending digitally signed and encrypted email messages, providing authentication, integrity, non-repudiation, and privacy. (بريد إلكتروني آمن (توقيع وتشفير).)"
    },
    {
        question: "DKIM (DomainKeys Identified Mail) (بريد معرف بمفاتيح النطاق)",
        answer: "An email authentication protocol that links a domain name to a message, proving the domain wasn't usurped and the message wasn't altered, by signing with the domain's key. (مصادقة نطاق البريد الإلكتروني.)"
    },
    {
        question: "SSL/TLS (Secure Sockets Layer / Transport Layer Security) (طبقة المقابس الآمنة / أمن طبقة النقل)",
        answer: "Standard technology for keeping an internet connection secure and data confidential between two systems (e.g., browser-server), using encryption and MACs. TLS is the successor to SSL. (تأمين اتصال الإنترنت.)"
    },
    {
        question: "HTTPS (Hyper Text Transfer Protocol Secure) (بروتوكول نقل النص التشعبي الآمن)",
        answer: "The combination of HTTP and SSL/TLS to implement secure communication (encrypting URL, content, forms, cookies, headers) between a web browser and a web server. (HTTP آمن (تصفح آمن).)"
    },
    {
        question: "IPsec (IP Security) (أمن بروتوكول الإنترنت)",
        answer: "A framework of protocols used to secure IP communications by authenticating and encrypting each IP packet, providing confidentiality, integrity, authentication, and anti-replay protection across networks. (تأمين اتصالات IP.)"
    },
    {
        question: "Feistel Cipher (Structure) (شفرة (هيكل) فايستل)",
        answer: "A symmetric structure used in many block ciphers that divides blocks into halves and processes them through multiple rounds involving substitution, permutation (XOR), and a round function. (هيكل تشفير كتل متماثل.)"
    },
    {
        question: "Block Cipher (شفرة الكتل)",
        answer: "A symmetric encryption algorithm that processes plaintext input in fixed-size blocks, producing a block of ciphertext of the same size. (تشفير بيانات ككتل ثابتة.)"
    },
    {
        question: "DES (Data Encryption Standard) (معيار تشفير البيانات)",
        answer: "An early, widely used symmetric block cipher standard using a 64-bit block and a 56-bit effective key, based on a Feistel structure with 16 rounds. (معيار تشفير كتل قديم.)"
    },
    {
        question: "Computationally Secure (آمن حسابيًا)",
        answer: "An encryption scheme where the cost or time required to break the cipher exceeds the value or useful lifetime of the encrypted information. (كسره مكلف حسابيًا.)"
    },
    {
        question: "Triple DES (3DES) (DES الثلاثي)",
        answer: "A symmetric block cipher that applies the DES algorithm three times with two or three unique keys to increase security (key size 112 or 168 bits), but is slower. (DES مكرر ثلاث مرات.)"
    },
    {
        question: "AES (Advanced Encryption Standard) (معيار التشفير المتقدم)",
        answer: "The current symmetric block cipher standard, using 128-bit blocks and key sizes of 128, 192, or 256 bits, based on a substitution-permutation network (not Feistel). (معيار تشفير حديث وقوي.)"
    },
    {
        question: "AES Round Functions (دوال جولة AES)",
        answer: "The four functions performed in each AES round: ByteSub (nonlinear byte substitution), ShiftRow (byte shifting within rows), MixColumn (mixing data within columns), AddRoundKey (XORing state with round key). (عمليات جولة AES الأربع.)"
    },
    {
        question: "IT Security Management (إدارة أمن تقنية المعلومات)",
        answer: "A process used to achieve and maintain appropriate levels of confidentiality, integrity, availability, accountability, authenticity, and reliability for IT systems. (إدارة أمن نظم المعلومات.)"
    },
    {
        question: "IT Security Policy (سياسة أمن تقنية المعلومات)",
        answer: "An organizational document developed to describe security objectives/strategies, define acceptable behavior/responsibilities, and refer to specific security rules/procedures. (وثيقة قواعد أمن المعلومات.)"
    },
    {
        question: "Computer Security Incident Response Team (CSIRT) (فريق الاستجابة لحوادث أمن الحاسوب)",
        answer: "A team responsible for rapidly detecting security incidents, minimizing loss, mitigating exploited weaknesses, and restoring computing services. (فريق استجابة للحوادث الأمنية.)"
    },
    {
        question: "Security Risk Assessment (تقييم مخاطر الأمن)",
        answer: "The process of identifying IT infrastructure risks and providing management with information to make reasonable decisions on resource deployment for mitigation. (تحديد مخاطر أمن المعلومات.)"
    },
    {
        question: "Baseline Approach (Risk Assessment) (المنهجية الأساسية (تقييم المخاطر))",
        answer: "A risk assessment approach using standard documents, codes of practice, and industry best practices to determine controls. (تقييم مخاطر بالمعايير.)"
    },
    {
        question: "Informal Approach (Risk Assessment) (المنهجية غير الرسمية (تقييم المخاطر))",
        answer: "A risk assessment approach that exploits the knowledge and expertise of individuals without a formal, structured process. (تقييم مخاطر بالخبرة.)"
    },
    {
        question: "Detailed Risk Analysis Approach (منهجية تحليل المخاطر المفصلة)",
        answer: "A risk assessment approach using a formal, structured process involving identification of assets, threats, vulnerabilities, likelihood, and consequences. (تحليل مخاطر مفصل ومنظم.)"
    },
    {
        question: "Combined Approach (Risk Assessment) (المنهجية المدمجة (تقييم المخاطر))",
        answer: "A risk assessment approach that combines elements of baseline, informal, and detailed risk analysis methods. (مزيج مناهج تقييم المخاطر.)"
    },
    {
        question: "Control (IT Security) (الضابط (أمن تقنية المعلومات))",
        answer: "A means of managing risk, including policies, procedures, guidelines, practices, or organizational structures (administrative, technical, management, or legal). (وسيلة لإدارة المخاطر.)"
    },
    {
        question: "IT Security Plan (خطة أمن تقنية المعلومات)",
        answer: "A document detailing what security actions will be done, resources needed, responsibilities assigned, and timelines to improve the organization's risk profile. (خطة إجراءات أمنية.)"
    },
    {
        question: "Security Awareness (التوعية الأمنية)",
        answer: "Programs seeking to inform and focus employee attention on issues related to security within the organization. (توعية الموظفين بالأمن.)"
    },
    {
        question: "Security Training (التدريب الأمني)",
        answer: "Programs designed to teach people the specific skills needed to perform their IS-related tasks more securely. (تعليم مهارات أمنية.)"
    },
    {
        question: "Security Education (التثقيف الأمني)",
        answer: "Learning targeted at security professionals and those whose jobs require in-depth expertise in security, often involving career development or external courses. (تعلم أمني متعمق للمحترفين.)"
    },
    {
        question: "Social Engineering (الهندسة الاجتماعية)",
        answer: "An attack vector relying on manipulating humans to disclose confidential information or perform actions beneficial to the attacker. (خداع البشر لكشف معلومات.)"
    },
    {
        question: "Phishing (التصيد الاحتيالي)",
        answer: "A type of social engineering attack, typically via email, attempting to deceive users into revealing sensitive information by masquerading as a trustworthy entity. (خداع بريدي لسرقة معلومات.)"
    },
    {
        question: "Malware (Malicious Software) (البرامج الضارة)",
        answer: "Software inserted into a system, usually covertly, with the intent to compromise confidentiality, integrity, availability, or otherwise disrupt the victim. (برنامج ضار يهدف للإضرار.)"
    },
    {
        question: "Virus (الفيروس)",
        answer: "Malware that attaches itself to a program and replicates by modifying other programs to include a copy of itself. (يلحق نفسه ببرامج ويتكاثر.)"
    },
    {
        question: "Worm (الدودة)",
        answer: "Malware that propagates copies of itself independently across networks, often exploiting vulnerabilities. (ينتشر ذاتيًا عبر الشبكات.)"
    },
    {
        question: "Logic Bomb (القنبلة المنطقية)",
        answer: "Malware designed to activate ('explode') and perform its malicious function when a specific condition is met. (ينشط عند شرط معين.)"
    },
    {
        question: "Trojan Horse (حصان طروادة)",
        answer: "Malware disguised as or hidden within legitimate software, containing additional malicious functionality. (ضار متنكر ببرنامج شرعي.)"
    },
    {
        question: "Backdoor (Trapdoor) (الباب الخلفي)",
        answer: "A hidden feature or mechanism in software that allows unauthorized access to functionality, bypassing normal security controls. (وصول مخفي غير مصرح به.)"
    },
    {
        question: "Keylogger (مسجل ضغطات المفاتيح)",
        answer: "Malware or hardware that secretly captures and records user keystrokes. (يسجل ضغطات المفاتيح سراً.)"
    },
    {
        question: "Rootkit (روت كيت)",
        answer: "A set of sophisticated tools used by attackers to gain and maintain root-level (administrator) access to a system while hiding their presence. (أدوات وصول جذري مخفية.)"
    },
    {
        question: "Zombie (Bot) (زومبي (بوت))",
        answer: "A compromised computer controlled remotely by an attacker (often part of a botnet) used to launch attacks like spam or DDoS. (جهاز مخترق يُتحكم به.)"
    },
    {
        question: "Botnet (شبكة البوتات)",
        answer: "A network of compromised computers (zombies or bots) controlled remotely by an attacker. (شبكة أجهزة مخترقة (زومبي).)"
    },
    {
        question: "Malware Signature (توقيع (بصمة) البرامج الضارة)",
        answer: "A recognizable pattern (e.g., sequence of bytes, structure) used by simple scanners to identify known malware. (نمط معروف لبرنامج ضار.)"
    },
    {
        question: "Heuristic Scanner (الماسح التجريبي/الاستدلالي)",
        answer: "A malware scanner that uses rules or algorithms to detect potentially malicious behavior or characteristics, rather than relying solely on known signatures. (يكتشف الضار بسلوكه.)"
    },
    {
        question: "Digital Immune System (النظام المناعي الرقمي)",
        answer: "A security approach designed to automatically detect new malware, analyze it centrally, and distribute detection/prevention information rapidly. (كشف وتحليل تلقائي للضار.)"
    },
    {
        question: "Computer Crime (Cybercrime) (جريمة الحاسوب (الجريمة السيبرانية))",
        answer: "Criminal activity in which computers or computer networks are a tool, target, or place of the crime. (جريمة باستخدام الحاسوب.)"
    },
    {
        question: "Intellectual Property (الملكية الفكرية)",
        answer: "Any intangible asset consisting of human knowledge and ideas (e.g., software, data, algorithms) protectable by copyright, trademarks, or patents. (إبداعات فكرية محمية.)"
    },
    {
        question: "Infringement (Intellectual Property) (الانتهاك (الملكية الفكرية))",
        answer: "The invasion or violation of the rights secured by copyrights, trademarks, or patents. (انتهاك حقوق الملكية الفكرية.)"
    },
    {
        question: "Digital Millennium Copyright Act (DMCA) (قانون الألفية الرقمية لحقوق الطبع والنشر)",
        answer: "A US copyright law that encourages technological measures to protect copyrighted works and prohibits circumventing those measures. (قانون حماية حقوق النشر الرقمية (أمريكي).)"
    },
    {
        question: "Digital Rights Management (DRM) (إدارة الحقوق الرقمية)",
        answer: "Systems and procedures ensuring digital rights holders are identified and paid, often imposing restrictions on copying or distribution, providing persistent content protection. (أنظمة حماية المحتوى الرقمي.)"
    },
    {
        question: "Privacy (الخصوصية)",
        answer: "Concerns regarding the collection, storage, access, and use of personal information and private details about individuals' lives. (الحق في سرية المعلومات الشخصية.)"
    },
    {
        question: "Ethics (الأخلاق)",
        answer: "A system of moral principles relating to the benefits and harms of actions, and the rightness or wrongness of motives and ends. (مبادئ الصواب والخطأ.)"
    }
];

// Function to create a cybersecurity deck with all cards
export const createCybersecurityDeck = () => {
    return {
        id: 'cybersecurity-deck-' + Date.now().toString(36),
        title: 'Cybersecurity Concepts',
        description: 'A comprehensive deck of cybersecurity terms and concepts in both English and Arabic',
        cards: cybersecurityCards.map(card => ({
            id: 'card-' + Math.random().toString(36).substr(2, 9),
            question: card.question,
            answer: card.answer,
            known: false,
            createdAt: new Date().toISOString()
        })),
        createdAt: new Date().toISOString()
    };
};