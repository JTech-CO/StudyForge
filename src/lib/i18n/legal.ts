export type LegalKind = 'privacy' | 'terms';
export type LegalLocale = 'ko' | 'en';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  summary: string;
  sections: LegalSection[];
}

const updated = '2026-07-13';

export const LEGAL_DOCUMENTS: Record<LegalLocale, Record<LegalKind, LegalDocument>> = {
  ko: {
    privacy: {
      title: '개인정보처리방침',
      updated,
      summary:
        'StudyForge는 계정 없이 동작하는 오픈소스 BYOK 학습 도구입니다. API 키와 노트북은 기본적으로 이용자의 브라우저에 저장되며, 생성 자료는 이용자가 선택한 AI 제공자에게 브라우저에서 직접 전송됩니다.',
      sections: [
        {
          heading: '1. 처리 주체와 문의처',
          paragraphs: [
            'StudyForge는 JTech-CO가 운영합니다. 개인정보 보호 및 서비스 관련 문의는 jtech-bryan@proton.me로 접수할 수 있습니다.',
            'StudyForge는 별도 회원가입이나 사용자 계정을 제공하지 않으며, 이용자를 직접 식별하기 위한 프로필을 생성하지 않습니다.',
          ],
        },
        {
          heading: '2. 처리하는 정보와 목적',
          bullets: [
            'AI API 키·토큰: 선택한 AI 제공자 인증과 모델 호출을 위해 사용합니다.',
            '학습 자료와 생성 입력: 노트·마인드맵·퀴즈·플래시카드·팟캐스트 생성을 위해 사용합니다.',
            '설정과 노트북: 언어·테마·모델 설정 유지와 생성 결과 보관을 위해 사용합니다.',
            '선택적 공유 데이터: 노트북 제목, 생성 결과, 공유 모드, 출처의 비식별 ID와 종류를 공유 링크 제공에 사용합니다.',
          ],
          paragraphs: [
            '공유 데이터에는 API 키, 원본 파일, 파일명과 직접 입력한 출처 제목을 포함하지 않도록 설계되어 있습니다. 다만 생성 결과 자체에 이용자가 입력한 개인정보가 포함되면 공유 결과에도 나타날 수 있으므로 공유 전에 내용을 확인해야 합니다.',
          ],
        },
        {
          heading: '3. 저장 위치, 보유 기간과 파기',
          bullets: [
            'API 키·토큰과 설정은 해당 브라우저의 localStorage에 저장되며 이용자가 브라우저 데이터를 삭제할 때까지 유지됩니다.',
            '노트북과 생성 결과는 해당 브라우저의 IndexedDB에 저장되며 앱에서 노트북을 삭제하거나 브라우저 데이터를 지우면 삭제됩니다.',
            '공유 링크 데이터는 선택적 Cloudflare Worker KV에 최대 30일간 저장된 뒤 자동 만료됩니다.',
            'AI 제공자와 호스팅 사업자가 처리하는 데이터의 보유 기간은 각 사업자의 정책을 따릅니다.',
          ],
          paragraphs: [
            '현재 공유 링크는 계정 없이 생성되므로 만료 전 원격 사본을 즉시 삭제하는 기능을 제공하지 않습니다. 민감한 정보를 공유하지 말고 링크 수신 범위를 확인하세요.',
          ],
        },
        {
          heading: '4. 외부 AI 제공자와 국외 처리',
          paragraphs: [
            '이용자가 생성을 요청하면 API 키와 학습 자료가 StudyForge 운영 서버를 거치지 않고 선택한 Google Gemini, OpenAI, Anthropic 또는 xAI API로 직접 전송됩니다. 오디오·영상·유튜브 원본 처리와 음성 합성은 Gemini로 전송됩니다.',
            '로컬 AI를 선택하면 텍스트 입력은 이용자가 설정한 로컬 OpenAI 호환 서버로 전송됩니다. 이용자가 별도로 Gemini 미디어 기능을 사용하지 않는 한 로컬 생성 입력은 클라우드 AI로 전송되지 않습니다.',
            '외부 제공자는 해외에서 데이터를 처리할 수 있으며, 처리 국가·보유 기간·학습 사용 여부는 이용자가 선택한 제공자의 이용약관과 개인정보처리방침을 확인해야 합니다.',
          ],
        },
        {
          heading: '5. 공유 링크와 제3자 열람',
          bullets: [
            '공유는 이용자가 명시적으로 공유 버튼을 실행한 경우에만 이루어집니다.',
            '8자리 공유 코드는 추측을 어렵게 하지만 인증 수단은 아닙니다. 링크를 가진 사람은 만료 전 내용을 열람할 수 있습니다.',
            '편집 가능 공유는 수신자가 자신의 브라우저에 사본을 저장하는 Fork 방식이며 원본 공유 데이터는 변경되지 않습니다.',
          ],
        },
        {
          heading: '6. 쿠키, 분석 도구와 접속 기록',
          paragraphs: [
            'StudyForge는 자체 계정, 광고, 행동 분석 도구와 추적 쿠키를 기본 제공하지 않습니다.',
            'GitHub Pages, Cloudflare 및 AI 제공자는 보안과 서비스 운영을 위해 IP 주소, 요청 시각, 사용자 에이전트 등의 접속 정보를 각자의 정책에 따라 처리할 수 있습니다.',
          ],
        },
        {
          heading: '7. 안전조치와 이용자의 선택',
          bullets: [
            'API 키는 StudyForge 서버로 전송하지 않고 브라우저 저장소에 보관합니다.',
            '공유 페이로드에서 파일명과 API 키를 제외하고, 렌더링 결과를 격리·검증합니다.',
            '브라우저 확장 프로그램, 악성 스크립트 또는 공용 기기의 다른 사용자가 localStorage를 읽을 가능성은 완전히 제거할 수 없습니다.',
          ],
          paragraphs: [
            '공용 기기에서는 API 키를 저장하지 말고, 민감정보·고유식별정보·건강정보 등 특별한 보호가 필요한 자료를 입력하기 전에 선택한 AI 제공자의 정책과 조직의 보안 규정을 확인하세요.',
          ],
        },
        {
          heading: '8. 권리 행사, 변경과 연락',
          paragraphs: [
            '이용자는 앱에서 노트북을 삭제하고 브라우저 저장소를 지워 로컬 데이터를 직접 삭제할 수 있습니다. 외부 AI 제공자가 보유한 데이터에 대한 접근·정정·삭제 요청은 해당 제공자에게 접수해야 합니다.',
            '이 방침의 내용이 변경되면 시행일과 변경 내용을 이 페이지에 반영합니다. 개인정보 관련 문의와 권리 행사 요청은 jtech-bryan@proton.me로 보내주세요.',
          ],
        },
      ],
    },
    terms: {
      title: '이용약관',
      updated,
      summary:
        '본 약관은 StudyForge 웹 애플리케이션과 오픈소스 소프트웨어의 이용 조건을 정합니다. 서비스를 이용하면 아래 조건과 선택한 외부 AI 제공자의 조건을 확인하고 동의한 것으로 봅니다.',
      sections: [
        {
          heading: '1. 서비스와 운영자',
          paragraphs: [
            'StudyForge는 JTech-CO가 제공하는 BYOK 학습 자료 생성 도구입니다. 문의는 jtech-bryan@proton.me로 접수할 수 있습니다.',
            '서비스는 계정 없이 제공되며, 텍스트 생성에는 이용자가 선택한 Gemini, OpenAI, Anthropic, xAI 또는 로컬 AI가 사용됩니다.',
          ],
        },
        {
          heading: '2. 이용 조건과 외부 API 비용',
          bullets: [
            '이용자는 자신이 적법하게 사용할 수 있는 API 키와 모델만 연결해야 합니다.',
            '외부 AI 제공자의 요금, 사용량 제한, 지역 제한과 계정 정지는 해당 제공자의 정책을 따르며 이용자가 부담합니다.',
            'API 키를 공용 기기에 저장하거나 다른 사람과 공유하지 않아야 합니다.',
          ],
        },
        {
          heading: '3. 입력 자료에 대한 책임',
          paragraphs: [
            '이용자는 업로드하거나 입력하는 문서, 영상, 음성, 링크 및 개인정보를 처리할 권한을 보유해야 합니다.',
            '타인의 저작권·개인정보·영업비밀을 침해하거나 법령과 조직 정책을 위반하는 자료를 입력해서는 안 됩니다. 민감정보가 포함된 자료는 외부 AI로 전송될 수 있으므로 사용 전에 별도 검토가 필요합니다.',
          ],
        },
        {
          heading: '4. AI 생성 결과',
          paragraphs: [
            'AI 생성 결과는 부정확하거나 불완전하거나 편향될 수 있습니다. 학습, 평가, 의료, 법률, 재무 또는 기타 중요한 의사결정에 사용하기 전에 이용자가 원문과 신뢰할 수 있는 출처로 검증해야 합니다.',
            'StudyForge는 생성 결과의 정확성, 완전성, 특정 목적 적합성 또는 제3자 권리 비침해를 보증하지 않습니다.',
          ],
        },
        {
          heading: '5. 공유 기능',
          bullets: [
            '공유 링크를 가진 사람은 만료 전 공유 내용을 열람할 수 있으므로 이용자가 수신자와 포함 내용을 관리해야 합니다.',
            '편집 가능 공유는 수신자 브라우저에 독립 사본을 만드는 방식이며 공동 편집이나 원본 접근 권한을 부여하지 않습니다.',
            '공유 데이터는 최대 30일 후 자동 만료되며, 현재 계정 기반 즉시 회수 기능은 제공되지 않습니다.',
          ],
        },
        {
          heading: '6. 금지 행위',
          bullets: [
            '불법 행위, 권리 침해, 사기, 괴롭힘 또는 유해 콘텐츠 제작을 위한 이용',
            '악성 코드 배포, 보안 우회, 서비스·Worker·외부 API에 과도한 부하를 주는 행위',
            '허가 없이 타인의 API 키, 계정, 개인정보 또는 기밀 자료를 사용하는 행위',
            '서비스의 정상 동작을 방해하거나 공유 코드에 대한 자동 대입을 시도하는 행위',
          ],
        },
        {
          heading: '7. 오픈소스와 지식재산권',
          paragraphs: [
            'StudyForge 소스 코드는 저장소에 표시된 MIT License에 따라 제공됩니다. 상표, 로고 및 제3자 라이브러리는 각각의 권리와 라이선스가 적용될 수 있습니다.',
            '이용자는 자신의 입력 자료에 대한 권리를 유지합니다. 생성 결과의 이용 가능 범위는 적용 법률, 원본 자료의 권리 및 선택한 AI 제공자의 조건에 따라 달라질 수 있습니다.',
          ],
        },
        {
          heading: '8. 서비스 변경과 중단',
          paragraphs: [
            'StudyForge는 외부 API, 브라우저 기능 및 선택적 Cloudflare Worker에 의존합니다. 제공자 정책 변경, 장애, 할당량 소진 또는 브라우저 제한으로 일부 기능이 중단될 수 있습니다.',
            '보안, 법령 준수 또는 유지보수를 위해 기능과 약관을 변경할 수 있으며 중요한 변경은 이 페이지에 반영합니다.',
          ],
        },
        {
          heading: '9. 보증 부인과 책임 제한',
          paragraphs: [
            '서비스와 소프트웨어는 관련 법률이 허용하는 최대 범위에서 현재 상태 그대로 제공됩니다. 중단 없는 이용, 데이터 보존 또는 특정 결과를 보증하지 않습니다.',
            '강행 법규에 달리 정함이 없는 한, 운영자는 API 비용, 데이터 손실, 공유 링크 노출, 생성 결과의 이용 또는 제3자 서비스로 인한 간접·특별·결과적 손해에 책임을 지지 않습니다.',
          ],
        },
        {
          heading: '10. 적용 법률, 분쟁과 문의',
          paragraphs: [
            '별도의 강행 규정이 적용되지 않는 범위에서 본 약관은 대한민국 법률을 따릅니다. 분쟁이 발생하면 정식 절차에 앞서 상호 협의를 위해 연락할 수 있습니다.',
            '약관 관련 문의는 jtech-bryan@proton.me로 보내주세요.',
          ],
        },
      ],
    },
  },
  en: {
    privacy: {
      title: 'Privacy Policy',
      updated,
      summary:
        'StudyForge is an open-source, account-free BYOK learning tool. API credentials and notebooks are stored in your browser by default, while generation inputs are sent directly from your browser to the AI provider you select.',
      sections: [
        {
          heading: '1. Controller and contact',
          paragraphs: [
            'StudyForge is operated by JTech-CO. Privacy and service inquiries can be sent to jtech-bryan@proton.me.',
            'StudyForge does not provide user accounts and does not create profiles intended to identify individual users.',
          ],
        },
        {
          heading: '2. Data processed and purposes',
          bullets: [
            'AI API keys and tokens: used to authenticate with the provider and invoke models.',
            'Learning materials and generation inputs: used to create notes, mindmaps, quizzes, flashcards, and podcasts.',
            'Settings and notebooks: used to retain language, theme, model preferences, and generated results.',
            'Optional share data: notebook title, generated artifacts, share mode, and non-identifying source IDs and types are used to provide share links.',
          ],
          paragraphs: [
            'Share payloads are designed to exclude API keys, original files, file names, and user-entered source titles. Generated artifacts may still contain personal data included in the input, so review all content before sharing.',
          ],
        },
        {
          heading: '3. Storage, retention, and deletion',
          bullets: [
            'API credentials and settings remain in browser localStorage until you clear browser data.',
            'Notebooks and generated artifacts remain in browser IndexedDB until you delete them in the app or clear browser data.',
            'Share-link data is stored in optional Cloudflare Worker KV for up to 30 days and then expires automatically.',
            'Retention by AI providers and hosting providers is governed by their respective policies.',
          ],
          paragraphs: [
            'Because shares are created without accounts, StudyForge currently does not provide immediate remote deletion before expiry. Do not share sensitive information and control who receives each link.',
          ],
        },
        {
          heading: '4. AI providers and international processing',
          paragraphs: [
            'When you request generation, credentials and learning materials are sent directly to the selected Google Gemini, OpenAI, Anthropic, or xAI API without passing through a StudyForge application server. Audio, video, YouTube source processing, and speech synthesis are sent to Gemini.',
            'When Local AI is selected, text inputs are sent to the OpenAI-compatible local endpoint you configure. Local generation inputs are not sent to a cloud AI unless you separately use Gemini media features.',
            'Providers may process data in other countries. Review the selected provider policy for processing locations, retention, and whether submitted data may be used for model improvement.',
          ],
        },
        {
          heading: '5. Share links and third-party access',
          bullets: [
            'Sharing occurs only when you explicitly use the share action.',
            'The eight-character code reduces guessability but is not authentication. Anyone with the link can view the shared content until it expires.',
            'Editable sharing creates an independent fork in the recipient browser and does not modify the original shared data.',
          ],
        },
        {
          heading: '6. Cookies, analytics, and access logs',
          paragraphs: [
            'StudyForge does not include first-party accounts, advertising, behavioral analytics, or tracking cookies by default.',
            'GitHub Pages, Cloudflare, and AI providers may process IP addresses, request times, user agents, and similar access information for security and operations under their own policies.',
          ],
        },
        {
          heading: '7. Safeguards and your choices',
          bullets: [
            'API credentials are kept out of StudyForge servers and stored in browser storage.',
            'File names and API keys are excluded from share payloads, and rendered model output is isolated and validated.',
            'Browser extensions, malicious scripts, or other users of a shared device may still be able to access localStorage.',
          ],
          paragraphs: [
            'Do not save credentials on shared devices. Before entering sensitive or specially protected data, review the selected provider policy and any security rules that apply to your organization.',
          ],
        },
        {
          heading: '8. Rights, changes, and contact',
          paragraphs: [
            'You can delete local notebooks in the app and clear browser storage. Requests concerning data retained by an external AI provider must be directed to that provider.',
            'Updates to this policy will be reflected on this page with a revised effective date. Send privacy questions or rights requests to jtech-bryan@proton.me.',
          ],
        },
      ],
    },
    terms: {
      title: 'Terms of Use',
      updated,
      summary:
        'These terms govern use of the StudyForge web application and open-source software. By using StudyForge, you acknowledge these terms and the terms of each external AI provider you select.',
      sections: [
        {
          heading: '1. Service and operator',
          paragraphs: [
            'StudyForge is a BYOK learning-material generator provided by JTech-CO. Questions can be sent to jtech-bryan@proton.me.',
            'The service is account-free. Text generation uses Gemini, OpenAI, Anthropic, xAI, or a local AI selected by the user.',
          ],
        },
        {
          heading: '2. Access and external API costs',
          bullets: [
            'You must connect only API credentials and models that you are authorized to use.',
            'Provider fees, quotas, regional restrictions, and account suspensions are governed by the provider and remain your responsibility.',
            'Do not store API credentials on shared devices or disclose them to others.',
          ],
        },
        {
          heading: '3. Responsibility for inputs',
          paragraphs: [
            'You must have the rights and permissions needed to process every document, video, audio file, link, and item of personal data you submit.',
            'Do not submit content that violates copyright, privacy, confidentiality, law, or organizational policy. Sensitive inputs may be sent to an external AI and require additional review before use.',
          ],
        },
        {
          heading: '4. AI-generated output',
          paragraphs: [
            'AI output may be inaccurate, incomplete, or biased. Verify it against original material and reliable sources before using it for learning, assessment, medical, legal, financial, or other important decisions.',
            'StudyForge does not warrant accuracy, completeness, fitness for a particular purpose, or non-infringement of generated output.',
          ],
        },
        {
          heading: '5. Sharing',
          bullets: [
            'Anyone with a share link can access its content until expiry, so you are responsible for the included content and recipients.',
            'Editable sharing creates an independent copy in the recipient browser; it does not provide collaborative editing or access to the original notebook.',
            'Share data expires after up to 30 days. Account-based immediate revocation is not currently available.',
          ],
        },
        {
          heading: '6. Prohibited conduct',
          bullets: [
            'Use for unlawful activity, rights infringement, fraud, harassment, or harmful content',
            'Malware distribution, security bypass, or excessive load against the app, Worker, or external APIs',
            'Unauthorized use of another person credentials, accounts, personal data, or confidential material',
            'Interference with normal service operation or automated enumeration of share codes',
          ],
        },
        {
          heading: '7. Open source and intellectual property',
          paragraphs: [
            'StudyForge source code is provided under the MIT License shown in the repository. Trademarks, logos, and third-party libraries may be governed by separate rights and licenses.',
            'You retain rights in your inputs. Rights to use generated output may depend on applicable law, rights in source material, and the selected AI provider terms.',
          ],
        },
        {
          heading: '8. Changes and availability',
          paragraphs: [
            'StudyForge depends on external APIs, browser capabilities, and an optional Cloudflare Worker. Provider changes, outages, depleted quotas, or browser restrictions may interrupt features.',
            'Features and these terms may change for security, legal compliance, or maintenance. Material changes will be reflected on this page.',
          ],
        },
        {
          heading: '9. Disclaimers and limitation of liability',
          paragraphs: [
            'To the maximum extent permitted by applicable law, the service and software are provided "as is" without a promise of uninterrupted access, data retention, or a particular outcome.',
            'Except where mandatory law provides otherwise, the operator is not liable for indirect, special, incidental, or consequential loss arising from API charges, data loss, exposed share links, use of generated output, or third-party services.',
          ],
        },
        {
          heading: '10. Governing law, disputes, and contact',
          paragraphs: [
            'Unless mandatory rules require otherwise, these terms are governed by the laws of the Republic of Korea. The parties may contact each other to seek an informal resolution before formal proceedings.',
            'Send questions about these terms to jtech-bryan@proton.me.',
          ],
        },
      ],
    },
  },
};