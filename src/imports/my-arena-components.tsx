Bạn đang tiếp tục module **Open Arena** trong cùng file Figma.
Dùng lại design system hiện có.
Ràng buộc:
- KHÔNG redesign
- Open Arena = points-only
- Verified Challenges chỉ là future placeholder
- UI phải có moderation và trust layer rõ ràng

Tạo page mới tên:
“06E – My Arena & Components”

SECTION 1 — MyArenaPage
Tạo:
MyArenaPage.tsx → /profile/arena

Tạo 3 breakpoint:
- Mobile L 390x844
- Tablet 834x1194
- Desktop Adaptive 1440x900

Nội dung:
- Header: “Sân chơi của tôi”
- top summary cards:
  • Arena Points
  • Active Challenges
  • Published Modes
  • Creator Score
- tabs:
  • My Rooms
  • Joined
  • Saved Modes
  • Drafts
  • History
- mỗi row/list item hiển thị:
  • challenge/mode title
  • format
  • status
  • participants
  • points
  • updated time
  • CTA nhỏ: “Xem”
- quick CTA: “Tạo challenge mới”
- tạo empty state cho từng tab

SECTION 2 — Reusable components
Tạo component set / variants:
1) Format Chips
- 1v1
- 1vN
- NvN
- Open Lobby

2) Resolution Chips
- Auto
- Mutual Confirm
- Referee
- Community Vote

3) Status Chips
- Draft
- Open
- Full
- Live
- Pending Result
- Resolved
- Under Review
- Reported
- Hidden
- Canceled

4) Trust / Badge Components
- Points Only
- Fair Play
- High Trust
- New Creator
- Future / Verified Locked

5) Team Layout Variants
- 1v1 card
- 1vN card
- NvN team card
- Open lobby slots card

SECTION 3 — Moderation components
Tạo:
- Report modal
- Block user bottom sheet
- Community rules modal
- Under review banner
- Reported content banner

SECTION 4 — UI states kit
Tạo states dùng lại cho:
- ArenaHomePage
- ArenaStudioPage
- ArenaModeDetailPage
- ArenaChallengeDetailPage
- ArenaLeaderboardPage
- MyArenaPage

State bắt buộc:
- Loading
- Empty
- Error
- Offline/Stale
- Draft
- Under Review
- Reported
- Hidden

Yêu cầu:
- tất cả components phải match 100% style hiện có
- ưu tiên Auto Layout + variants
- tạo sticky notes ngoài frame