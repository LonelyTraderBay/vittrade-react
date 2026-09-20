Bạn đang tiếp tục module **Open Arena** trong cùng file Figma.
Dùng lại design system hiện có và style từ các page Open Arena trước đó.
Ràng buộc:
- KHÔNG redesign
- Open Arena = points-only
- challenge phải có rules, moderation, trust layer rõ ràng

Tạo page mới tên:
“06D – Arena Challenge”

Tạo 2 màn hình chính, mỗi màn có 3 breakpoint:
- Mobile L 390x844
- Tablet 834x1194
- Desktop Adaptive 1440x900

1) ArenaChallengeDetailPage.tsx → /arena/challenge/:challengeId
Đây là màn quan trọng nhất.

Top section:
- challenge title
- mode title
- status chip
- privacy chip
- format chip
- points-only badge

Tạo 4 participant layout variants:
A. 1v1
- 2 participant cards đối diện nhau

B. 1vN
- 1 host card đối diện group stack

C. NvN
- 2 team cards
- captain badge + member pills

D. Open Lobby
- slots filled / slots open / waiting participants

Main sections:
1. Score / live status card
- entry points
- reward pool
- time left / end date
- progress / round / current status

2. Rules summary card
- win condition
- resolution method
- evidence requirement
- void / cancel rule

3. Tabs
- Participants
- Rules
- Activity
- Evidence
- Notes

4. Activity feed
- joined
- accepted
- submitted evidence
- result proposed
- confirmed
- reported

5. Actions theo state
- open → “Tham gia”
- invite pending → “Chấp nhận” / “Từ chối”
- live → “Gửi bằng chứng”
- pending result → “Xác nhận kết quả”
- resolved → “Tái đấu”
- luôn có:
  • Report
  • Block creator/user
  • Share room

6. Warning banners
- “Arena Points chỉ dùng trong Open Arena”
- “Không thỏa thuận giao dịch ngoài nền tảng”
- “Challenge này đang được xem xét”
- “Nội dung đã bị báo cáo”

2) ArenaJoinPage.tsx → /arena/challenge/:challengeId/join
Nội dung:
- title: “Tham gia challenge”
- challenge summary
- room privacy
- selected team / selected side
- entry points
- end time
- creator / host info
- rule summary
- checkbox acknowledgements:
  • “Tôi đã đọc luật chơi”
  • “Tôi hiểu đây là Arena Points, không phải tài sản rút được”
- primary CTA: “Tham gia”
- secondary CTA: “Từ chối”

Tạo state frames cho Challenge Detail:
- Open
- Full
- Live
- Pending Result
- Resolved
- Under Review
- Reported
- Hidden
- Canceled
- Error
- Offline/Stale

Tạo prototype demo:
- ArenaChallengeDetailPage → ArenaJoinPage
- ArenaJoinPage → ArenaChallengeDetailPage (state Live)

Tạo sticky note ngoài frame:
- File / Route / State / Notes