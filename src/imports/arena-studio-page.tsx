Bạn đang tiếp tục module **Open Arena** trong cùng file Figma đã có page “06A – Open Arena Foundation”.
Hãy dùng lại style và components hiện có.
Ràng buộc:
- KHÔNG redesign
- KHÔNG đổi bottom nav
- Open Arena = points-only
- Verified Challenges chỉ là future placeholder

Tạo page mới tên:
“06B – Arena Studio”

Tạo màn:
ArenaStudioPage.tsx → /arena/studio

Tạo 3 breakpoint:
- Mobile L 390x844
- Tablet 834x1194
- Desktop Adaptive 1440x900

Mục tiêu UX:
- user cảm thấy mình đang tự tạo ra game/challenge mới
- wizard rõ ràng, dễ hiểu trong 5 giây
- mỗi step chỉ có 1 CTA chính
- có progress stepper trên đầu
- desktop có summary sidebar/card

Tạo 6 step frames riêng:

STEP 1 — Chọn template
Cards:
- Prediction
- Closest Guess
- Team Battle
- Community Vote
- Proof Challenge
- Bracket
Mỗi template có:
- mô tả ngắn
- format hỗ trợ
- mức độ phức tạp
- badge “Points-only supported”
- một vài template nâng cao có disabled chip “Verified only” để future-ready

STEP 2 — Cấu trúc trận đấu
Fields / selections:
- Match format:
  • 1v1
  • 1vN
  • NvN
  • Open Lobby
- Team size / slot count
- Captain toggle
- Join style:
  • Invite only
  • Public room
  • Unlisted
- Max participants

STEP 3 — Luật chơi
- Challenge title
- Category
- Description
- Win condition
- Time limit / end date
- Optional tie rule
- Optional rematch enabled
- Toggle: “Lưu thành reusable mode”

STEP 4 — Cách chốt kết quả
Cards:
- Auto / linked source
- Mutual confirm
- Referee
- Community vote
Nếu chọn từng loại, hiện field tương ứng:
- Auto → source label / source URL placeholder
- Mutual → note “Cả 2 bên phải xác nhận”
- Referee → selector “Người phân xử”
- Vote → “Số phiếu tối thiểu / thời gian vote”

STEP 5 — Arena Points & quyền riêng tư
- Arena Points entry
- Reward pool summary
- Visibility
- Join deadline
- Evidence required toggle
- House Rules summary card tự sinh
- moderation note ngắn

STEP 6 — Review & Publish
Review card hiển thị rõ:
- template
- format
- participants
- rules summary
- resolution method
- points
- privacy
- moderation notice
Primary CTA: “Mở phòng”
Secondary CTA: “Lưu nháp”

Tạo thêm state frames:
- Draft
- Loading
- Error
- Under Review
- Offline/Stale

Tạo sticky note ngoài frame:
- File: ArenaStudioPage.tsx
- Route: /arena/studio
- Notes: wizard tạo challenge/mode, points-only, future-ready cho verified