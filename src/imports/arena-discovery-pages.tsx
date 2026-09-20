Bạn đang tiếp tục module **Open Arena** trong cùng file Figma.
Hãy dùng lại style và components từ page 06A và 06B.
Ràng buộc:
- KHÔNG redesign
- Open Arena = points-only
- UI phải nghiêm túc, minh bạch, không casino-like

Tạo page mới tên:
“06C – Arena Discovery”

Tạo 3 màn hình, mỗi màn có 3 breakpoint:
- Mobile L 390x844
- Tablet 834x1194
- Desktop Adaptive 1440x900

1) ArenaModeDetailPage.tsx → /arena/mode/:modeId
Nội dung:
- mode header:
  • mode title
  • creator name
  • creator badge
  • clone count
  • active rooms
  • difficulty chip
  • points-only chip
- Description card
- Rules summary card:
  • allowed formats
  • win condition
  • resolution type
  • average duration
  • dispute risk level
- Stats row:
  • completion rate
  • fair play
  • report rate
  • repeat usage
- CTA area:
  • primary: “Dùng mode này”
  • secondary: “Tạo room mới”
- Recent rooms list
- Related modes carousel

2) ArenaCreatorPage.tsx → /arena/creator/:creatorId
Nội dung:
- creator avatar placeholder
- creator name
- creator level / badge
- fair play score
- completed rooms
- clone count
- community trust score
- tabs:
  • Modes
  • Live Rooms
  • History
  • About
- cards/stat blocks:
  • modes created
  • dispute rate
  • completion rate
  • creator trust score
  • community rating
- CTA nhỏ:
  • “Xem mode”
  • “Dùng mode”
  • “Báo cáo creator”

3) ArenaLeaderboardPage.tsx → /arena/leaderboard
Nội dung:
- title: “Arena Leaderboard”
- tabs:
  • Creators
  • Players
  • Teams
- metric chips:
  • Fair Play
  • Popularity
  • Win Rate
  • Activity
  • Completion Quality
- season filter:
  • Today
  • Weekly
  • Monthly
  • Season
- sections:
  • Top creators
  • Top players
  • Rising creators
  • Cleanest rooms / most trusted

Yêu cầu:
- leaderboard không nhấn mạnh tiền bạc
- nhấn mạnh trust, fairness, consistency
- copywriting tiếng Việt ngắn gọn
- tạo sticky notes ngoài frame với File / Route / Notes