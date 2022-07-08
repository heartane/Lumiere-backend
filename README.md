<p align="center">
  <a href="https://www.lumieregallery.site/">
    <img src="https://user-images.githubusercontent.com/83930702/143972152-84715903-5971-49dc-b782-1a482495b3fc.png" height="96">
    <h3 align="center">Lumiere</h3>
  </a>
</p>

<p align="center">
  The artwork online gallery, Share the spirit.
</p>

<p align="center">
  <a href="https://github.com/heartane/Lumiere-backend/wiki"><strong>Documentation</strong></a> ·
  <a href="https://www.notion.so/Minimanimo-0bd73eaa9a904b5bb554b876603bab0b"><strong>Team Portfolio</strong></a> ·
  <a href="https://github.com/heartane/Lumiere-backend/files/9038245/_.pdf"><strong>My Resume</strong></a>
</p>
<br/>

# 🌟 Lumiere
<p> <strong> 루미에르는 아마추어 및 신입 작가의 캔버스 작품을 소비자와 이어주는 E-Commerce 플랫폼입니다. </strong> <br/>
<br/>
이 서비스는 미대를 졸업하고 여전히 취미로 그림을 그리는 친구의 작품이 작업실에 마냥 쌓여있는 것이 아깝다는 생각에서 시작되었습니다. <br/>
캔버스화는 미술관에서나 보는 범접할 수 없는 예술이라는 관념에서 벗어나, <br/>
보다 쉽게 접하고 하나쯤은 소유할 수 있으며, 더불어 쉽게 판매할 수 있다는 취지를 가지고 프로젝트를 진행하였습니다. </p>

## Refactoring backend
<p>
엔터프라이즈의 시각에서는 어떤 점이 중요할까 고민하고 구현해보고자 리팩토링을 시작했습니다. <br/>
실 서비스에는 안정성과 지속적인 개선, 확장을 가능토록 하는 환경이 중요함을 느끼고 인프런 강의를 수강하며 5월부터 스터디를 지속해 오고 있습니다.
</p>

<h4> 본격적인 리팩토링 시작 전, 아래의 리스트를 작성하고 이 방향으로 나아가고 있습니다. </h4>

- [ ] 클래스와 함수가 책임과 역할에 맞게 잘 쪼개져 있는가?
    - [ ]  하나의 클래스가 너무 많은 책임을 가지진 않는가?
    - [ ]  하나의 함수가 너무 많은 역할을 지고 있지는 않는가?
- [ ]  주요 비즈니스 로직에 대한 테스트 코드를 작성하는가?
- [ ]  코드의 가독성을 높이기 위한 고민을 했는가?
    - [ ]  남이 잘 이해할 수 있는 코드인가?
- [ ]  프레임워크에서 제공하는 기본 아키텍처에 대한 이해를 하고 있는가?
- [ ]  반복되는 작업들은 자동화하는가?
- [ ]  프로젝트의 문서화(+README)가 잘 되어 있는가?

### following OOP SOLID principles
"서로 다른 세포들이 협력하며 하나의 생명체"를 만드는 것과 유사한 객체 지향. <br/>
리팩토링으로 직접 구현하면서 면접 답변을 외울 떄와는 다르게 그 본질을 이해해 나가고 있습니다. <br/>

### following Clean Architecture principles
좋은 아키텍처는 일관적이고 견고한 코드 작성에 기둥임을 알게되었습니다. <br/>
기존에 작성한 MVC 디자인 패턴에서 관심사 분리의 스코프를 넓혀 레이어 별로 책임을 분명히 하고 <br/>
소프트웨어의 코어인 비즈니스 로직을 최대한 순수하게 유지하기 위해 클린 아키텍처를 도입하였습니다. <br/>

### The Dependency Rule
OOP, 아키텍처 등 모든 좋은 코드를 위한 패러다임에서 중요한 포인트 중 하나는 의존성 관리입니다. <br/>
<br/>
관심사 분리를 위해서는 의존성 규칙이 필요하다는 것을 깨달았습니다. <br/>
소프트웨어가 외부 인프라가 아닌 어플리케이션 중심의 설계가 될 수 있도록, 외부에서 내부 단 방향 의존흐름에 유념하여 리팩토링하고 있습니다.  <br/>

### write test code
코드 변경에 따른 버그로부터 안정적인 리팩토링을 할 수 있도록 하는 테스트의 중요성을 알게 되었습니다. <br/>
또 프로젝트의 전반적인 내용을 한눈에 파악할 수 있는 하나의 직관적인 문서로써 테스트 코드를 점차 작성하고 있습니다. <br/>

### Backend anatomy
```
backend 
 └ src                              → 어플리케이션 소스 파일
    └ application                   → 어플리케이션의 비즈니스 로직 위치
       └ tests                      → 서비스 유닛 테스트
    └ domain                        → 순수 어플리케이션 코어 데이터 & 레포지토리
    └ infrastructure                → 프레임워크와 외부 모듈들
       └ config                     → 어플리케이션 환경 설정 폴더
          └ service-locator.js      → 환경에 따른 모듈 인스턴스 생성 파일
       └ database                   → 데이터베이스 ORM & ODM (Mongoose for MongoDB)
          └ mongoose                → 몽구스 연결 및 모델 스키마
       └ repositories               → 도메인 레포지토리의 구현체
       └ security                   → Security tools (ex: JwtTokenManager)
       └ express-server             → Express 웹 서버 설정
          └ index.js                → Express 서버 생성
          └ logger.js               → logger file 설정
          └ middlewares             → Express 미들웨어 (auth, error, validator..)
             └ tests                → 미들웨어 유닛 테스트
       └ index.js                   → Express 서버와 DB 호출
    └ interfaces                    → 외부와 내부를 연결하는 어댑터
       └ controllers                → Express 라우트 핸들러
       └ routes                     → Express 라우트 
       └ oauth                      → 소설 로그인 클래스 OAuth2.0 ( naver, google, kakao )
       └ helper                     → format helper
          └ validate.js             → 요청 데이터의 유효성 검사
          └ serializer.js           → 비즈니스 로직의 객체를 특정 응답 형태로 변환하여 전달
 └ main.js                          → 어플리케이션 엔트리 포인트
 └ tests                            → 통합 테스트 
 └ node_modules                     → NPM dependencies
```

### Flow of Control



