# Tasks

> 지금/앞으로 할 작업을 적어두는 문서.
> 완료된 항목은 여기서 지우고, 요약은 `changelog.md`에,
> 중요한 선택 이유는 `decisions.md`에 기록한다.

---

## 최우선

### [ ] 저장소 교체 (localStorage → DB/API)
- 현재: 인증(Auth.js + Neon Postgres)은 붙었지만 **가계부 데이터는 아직 localStorage**에 있다.
- 목표: 로그인하면 여러 기기에서 데이터를 이어 볼 수 있게 한다.
- 남은 범위: `migration-plan.md`의 **Phase 8**(CRUD 엔드포인트, `storage/repository.ts` API 교체,
  최초 로그인 시 로컬 → 서버 이관) + **Phase 9**(로딩/에러 상태, 로그아웃·세션 만료 처리).
- 상세 체크리스트: **[`docs/migration-plan.md`](./migration-plan.md)** 참조 — 진행 상황은 그쪽에서 관리한다.
