# Development Conventions

carol의 개발, 커밋, 버전 관리 기준입니다.

## Version Policy

버전은 두 종류로 구분합니다.

| 종류 | 예시 | 관리 주체 | 용도 |
|------|------|-----------|------|
| 릴리스 버전 | `0.2.0` | 사람 | 기능 단위 릴리스, changelog, 태그 |
| 빌드 버전 | `build-42-a1b2c3d` | CI | 실제 배포된 컨테이너 식별, `/상태` 표시 |

### 릴리스 버전

- `package.json`의 `version`은 릴리스 의도를 담는 제품 버전입니다.
- CI가 `package.json`을 자동 커밋해서 올리지 않습니다. CI 자동 커밋은 push loop, 권한 문제, 원치 않는 릴리스 증가를 만들 수 있습니다.
- 버전은 릴리스 PR 또는 릴리스 커밋에서 사람이 명시적으로 올립니다.

### 빌드 버전

- GitHub Actions는 배포마다 빌드 버전을 자동 생성합니다.
- 권장 형식은 `build-${GITHUB_RUN_NUMBER}-${GITHUB_SHA::7}`입니다.
- 봇의 `/상태` 명령은 가능하면 빌드 버전을 표시하고, 값이 없으면 `package.json`의 릴리스 버전을 fallback으로 표시합니다.

## Semantic Versioning

`package.json` 버전은 SemVer 형식을 따릅니다.

| 변경 유형 | 증가 위치 | 예시 |
|-----------|-----------|------|
| 호환되지 않는 데이터/명령/API 변경 | major | `1.4.2` -> `2.0.0` |
| 새 기능, 명령어, 웹/API 경로 추가 | minor | `1.4.2` -> `1.5.0` |
| 버그 수정, 문서 수정, 내부 개선 | patch | `1.4.2` -> `1.4.3` |

`0.x` 구간에서는 breaking change도 minor를 올릴 수 있습니다. 외부 사용자가 의존하는 공개 API나 명령어 동작을 깨는 경우에는 문서에 명시합니다.

## Release Checklist

릴리스 버전을 올릴 때는 한 커밋 또는 한 PR 안에서 다음을 함께 처리합니다.

1. `package.json`의 `version`을 올립니다.
2. `package-lock.json`이 있다면 함께 반영합니다.
3. 사용자에게 보이는 명령어, 웹 경로, 설정이 바뀌었으면 `README.md` 또는 `docs/`를 갱신합니다.
4. `npm run build`가 통과하는지 확인합니다.
5. 릴리스 커밋 메시지는 `chore(release): vX.Y.Z` 형식을 사용합니다.

## Commit Guide

커밋 메시지는 Conventional Commits 스타일을 사용합니다.

```text
<type>(<scope>): <summary>
```

예시:

```text
feat(web): add invite redirect
fix(scraper): handle missing rating target rows
docs(readme): refresh slash command list
chore(release): v0.2.0
```

### Types

| type | 용도 |
|------|------|
| `feat` | 사용자에게 보이는 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서만 변경 |
| `refactor` | 동작 변화 없는 구조 개선 |
| `perf` | 성능 개선 |
| `test` | 테스트 추가/수정 |
| `build` | Docker, npm, CI 빌드 설정 |
| `ci` | GitHub Actions 등 CI 설정 |
| `chore` | 릴리스, 의존성, 기타 유지보수 |

### Scopes

자주 쓰는 scope는 다음과 같습니다.

- `bot`: Discord 클라이언트, 명령 등록, 인터랙션 라우팅
- `commands`: slash command 구현
- `web`: raw Node HTTP 서버, 북마클릿, 설정 페이지
- `scraper`: maimai DX NET HTML 파싱
- `db`: SQLite schema, 캐시, 세션 저장
- `rating-card`: 레이팅표 PNG 렌더링
- `docs`: README와 docs 문서
- `ci`: GitHub Actions 배포 흐름

## Branch And PR Rules

- 한 PR은 하나의 목적만 다룹니다.
- 기능 변경과 대규모 리팩터링은 같은 PR에 섞지 않습니다.
- DB schema 변경은 additive migration만 허용합니다. `DROP`, `RENAME` 기반 마이그레이션은 사용하지 않습니다.
- 웹 서버는 Express/router를 새로 도입하지 않고, 현재 raw Node HTTP 라우팅 스타일을 유지합니다.
- Discord button `customId` 형식은 라우터와 builder를 함께 바꿀 때만 수정합니다.

## Validation

현재 프로젝트에는 별도 test runner, linter, formatter가 없습니다. 변경 후 최소 검증은 다음입니다.

```bash
npm run build
```

웹 경로를 바꿨다면 `npm run dev:web`로 로컬 서버를 띄우고 `curl` 또는 브라우저로 해당 경로를 직접 확인합니다.

Discord 명령어를 바꿨다면 개발 서버에서 실제 slash command 또는 버튼 인터랙션으로 한 번 확인합니다.
