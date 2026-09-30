# Quy định cho AI khi thay đổi mã

Các quy định này áp dụng cho mọi AI agent viết hoặc sửa mã trong repository. Chúng bổ sung cho `ARCHITECTURE.md`, `guidelines/Guidelines.md`, hợp đồng API và quy ước của module. Hãy đọc hướng dẫn gần khu vực cần sửa trước khi thay đổi. Nếu yêu cầu cụ thể mâu thuẫn với một quy tắc bên dưới, nêu rõ xung đột và hệ quả; không âm thầm bỏ qua yêu cầu hay quy tắc.

## 1. Mục tiêu và cách hiểu “đơn giản”

- Chọn cách làm đơn giản nhất vẫn đúng yêu cầu, đủ nhanh, ổn định, an toàn và dễ kiểm tra.
- Đơn giản không đồng nghĩa với ít dòng mã. Ưu tiên ít trạng thái, nhánh, thành phần, kết nối, phụ thuộc và điểm có thể hỏng hơn.
- Bắt đầu từ yêu cầu và ràng buộc thực tế; không áp mẫu thiết kế quen thuộc trước khi hiểu vấn đề.
- Không thêm kiến trúc, khả năng mở rộng, tự động xử lý hoặc xử lý trường hợp hiếm chỉ vì “sau này có thể cần”. Mỗi phần thêm vào phải giải thích được yêu cầu, rủi ro hoặc bằng chứng khiến nó cần thiết.
- Với tình huống hiếm, ít nguy hiểm, ưu tiên phát hiện và báo để người xử lý nếu tự động hóa làm hệ thống phức tạp hơn. Với tình huống hiếm nhưng có thể gây mất tiền, mất dữ liệu, vượt quyền hoặc trạng thái không thể khôi phục, phải từ chối hoặc dừng an toàn.
- Chỉ tối ưu hiệu năng sau khi hiểu ngưỡng cần đạt. Không tăng độ phức tạp nếu cách đơn giản đã đáp ứng; dùng số đo hoặc bằng chứng để biện minh cho tối ưu.

## 2. Trước khi viết mã

- Xác định hành vi cần có, dữ liệu đầu vào, điều kiện bắt buộc luôn đúng, lỗi có thể thấy được và mức độ ảnh hưởng của lỗi. Đọc hợp đồng, mã và kiểm thử liên quan để giữ đúng ranh giới kiến trúc hiện có.
- Chọn quy mô phân tích theo rủi ro: sửa cục bộ đơn giản thì giữ quy trình nhẹ; luồng nhiều trạng thái, dịch vụ ngoài, xác thực, tiền, số dư, escrow hoặc dữ liệu cần nhất quán thì phải mô tả rõ trạng thái, chuyển tiếp, bất biến và lỗi trước khi triển khai.
- Xem thiết kế ban đầu là giả thuyết. Thử bỏ thành phần, trạng thái, nhánh tự động hoặc kết nối; thử gộp các trạng thái có cùng cách xử lý. Sau mỗi lần giản lược, kiểm tra lại mọi yêu cầu và bất biến.
- Chỉ lưu trạng thái làm thay đổi hành vi. Gộp trạng thái có cùng cách xử lý; tính lại trạng thái có thể suy ra từ dữ liệu khác; không tạo trạng thái chỉ để biểu diễn mọi điều kiện hay mọi lỗi kỹ thuật.
- Chỉ tạo trạng thái chờ, retry hoặc phục hồi riêng khi chúng có hành vi và quy tắc kết thúc riêng. Không giả định thao tác bên ngoài thất bại chỉ vì mất phản hồi; phải phân biệt kết quả thất bại với kết quả chưa xác định khi nghiệp vụ yêu cầu.

## 3. Quyền sở hữu trạng thái và kết nối

- Mỗi miền hoặc thành phần có một nguồn sự thật và một nơi chịu trách nhiệm thay đổi trạng thái của nó. Thành phần khác gửi dữ liệu hoặc sự kiện qua giao diện đã định, không sửa lén trạng thái nội bộ.
- Truyền xuống đúng phần dữ liệu mà nơi nhận cần; không đưa toàn bộ trạng thái hệ thống vào một thành phần. Chỉ giữ bản sao khi có lý do nghiệp vụ rõ ràng.
- Giữ tương tác gần và dễ lần theo. Một thành phần nên tác động trực tiếp tới phần kề nó; tránh để thay đổi nhỏ phải đi qua nhiều tầng hoặc buộc một miền biết chi tiết các miền phía sau.
- Với từng tương tác quan trọng, xác định nơi nhận giữ nguyên trạng thái, đổi trạng thái, từ chối hay cần người xử lý. Không để nhánh nghiệp vụ quan trọng ở trạng thái chưa xác định.
- Giữ luồng quyết định chính ngắn. Đưa thông báo, thống kê và ghi nhận phụ ra khỏi luồng nếu chúng không quyết định bước tiếp theo. Tiền, quyền truy cập và dữ liệu cần nhất quán phải nằm trong phần được bảo đảm hoàn tất trước khi luồng tiếp tục.
- Kiểm tra khả năng vòng lặp, xử lý sự kiện trùng và thứ tự sự kiện nếu chúng có thể làm đổi kết quả.

## 4. Điều kiện và dịch vụ bên ngoài

- Xem điều kiện toàn cục là dữ liệu đầu vào hoặc điều kiện cho phép; chỉ đưa phần cần thiết tới nơi sử dụng. Nếu quyết định cần được giải thích về sau, lưu giá trị hoặc phiên bản thực tế đã dùng, không dùng giá trị hiện tại để diễn giải lại quá khứ.
- Mô hình hóa dịch vụ ngoài theo hợp đồng và kết quả mà tính năng có thể quan sát; không mô phỏng toàn bộ hệ thống bên ngoài.
- Gom các lỗi kỹ thuật khác nhau nếu chúng dẫn tới cùng cách xử lý nghiệp vụ. Không đưa chi tiết lỗi mạng thành hàng loạt trạng thái nghiệp vụ.
- Tách quyết định nghiệp vụ khỏi I/O khi điều đó làm logic rõ và dễ kiểm tra hơn: phần quyết định nhận trạng thái và dữ liệu, trả kết quả cùng các hiệu ứng cần thực hiện; phần khác gọi mạng, lưu dữ liệu hoặc thực thi hiệu ứng. Không tạo thêm lớp chỉ để tuân theo hình thức.
- Với giao dịch tiền hoặc blockchain, phân biệt rõ đang chờ, thành công đã xác nhận, thất bại và chưa xác định/chưa đủ xác nhận. Xử lý gửi lặp, phản hồi mất, dữ liệu cũ hoặc bất nhất theo hợp đồng; không báo thành công khi bằng chứng chưa đủ.

## 5. Mô tả thiết kế cho luồng phức tạp

- Với thay đổi có máy trạng thái hoặc nghiệp vụ rủi ro cao, lưu thiết kế ở dạng có cấu trúc, dễ đối chiếu với mã (ví dụ schema, bảng chuyển trạng thái hoặc mô hình TypeScript). Ghi rõ các trạng thái, dữ liệu, sự kiện, điều kiện, bất biến và kết quả của chuyển tiếp.
- Gán mã ổn định cho chuyển tiếp khi mã đó giúp sinh kiểm thử, ghi lịch sử hoặc đối chiếu thiết kế với mã. Dùng định dạng nhẹ phù hợp với repo; không dựng framework riêng nếu tài liệu hoặc kiểu dữ liệu hiện có đã đủ.
- Người duyệt cần thấy yêu cầu, giả định, trường hợp tự động so với trường hợp cần người xử lý, rủi ro và các thay đổi hành vi quan trọng. Không cần trình bày suy luận nội bộ từng bước.

## 6. Triển khai và kiểm chứng

- Xem việc triển khai là phép thử thiết kế. Nếu cần thêm nhiều trạng thái, biến ngoại lệ hoặc kết nối ngoài dự kiến, dừng lại để xác định vấn đề nằm ở yêu cầu, giả định, thiết kế hay mã; sửa thiết kế trước khi tiếp tục nếu thiết kế sai.
- Với phần thay thế đã được xác định, triển khai theo hợp đồng và yêu cầu đã kiểm chứng; dùng mã cũ làm bằng chứng hành vi, không mặc định nó là chuẩn cuối cùng. Không viết lại phạm vi rộng hoặc thay đổi hành vi ngoài yêu cầu nếu không có lý do và bằng chứng.
- Kiểm chứng theo hành vi và rủi ro, không chỉ theo số dòng được chạy. Với luồng có trạng thái, bao phủ các trạng thái và chuyển tiếp quan trọng, điều kiện đúng/sai, yêu cầu trùng hoặc sai thứ tự, sự kiện gần đồng thời và lỗi giữa các tác động bên ngoài khi có liên quan.
- Với tích hợp dễ lỗi, mô phỏng những kết quả quan sát được có thể làm đổi quyết định: mất kết nối, chậm hoặc mất phản hồi, dữ liệu cũ/bất nhất, gửi lại yêu cầu, dừng rồi chạy lại ở ranh giới lưu bền. Chỉ mô phỏng trường hợp liên quan tới hợp đồng của tính năng; bổ sung sự cố thực tế thành ca kiểm chứng hồi quy.
- Với bất biến quan trọng, kiểm tra sức phát hiện của bộ kiểm thử bằng cách xem các lỗi đại diện như bỏ điều kiện, đổi chuyển tiếp hoặc bỏ chống trùng có làm kiểm thử thất bại không. Dùng mutation testing khi phù hợp và có thể khôi phục an toàn; không để lại đột biến trong mã giao.
- Sau khi sửa, suy ngược trạng thái, luồng và kết nối thực tế từ mã rồi đối chiếu với thiết kế hoặc hợp đồng. Giải thích mọi khác biệt có chủ ý; khác biệt nghiệp vụ quan trọng chưa giải thích được thì chưa chấp nhận thay đổi.
- Khi tìm lỗi, bắt đầu từ thành phần sai và các thành phần kết nối trực tiếp; mở rộng phạm vi khi có bằng chứng lỗi lan xa. Không sửa phần không liên quan.

## 7. Lịch sử, bảo mật và hoàn tất

- Chỉ ghi lịch sử chuyển trạng thái khi cần kiểm toán, khôi phục hoặc chẩn đoán. Khi ghi, lưu tối thiểu dữ liệu đầu vào/điều kiện cần thiết, trạng thái trước/sau, phiên bản hoặc quy tắc đã dùng; không ghi bí mật, token hay dữ liệu nhạy cảm không cần thiết.
- Trước khi kết luận, xem lại diff để xác nhận thay đổi đúng phạm vi, mã phản ánh đúng thiết kế, không có độ phức tạp không được biện minh và các kiểm chứng đã chạy được báo cáo chính xác.
- Báo rõ những gì đã đổi, lý do, kiểm chứng đã thực hiện và giới hạn còn lại. Không tuyên bố mức an toàn, độ bao phủ hoặc khả năng production cao hơn bằng chứng thực tế.

## 8. Workflow chung, plugin và skill

- Bộ Universal được tiếp nhận là [AI_RULES.md](AI_RULES.md) và [PROJECT_BOOTSTRAP_PROMPT.txt](PROJECT_BOOTSTRAP_PROMPT.txt) phiên bản 3.1. Luôn đọc HỢP ĐỒNG DÙNG CHUNG, KHỞI ĐỘNG và các mục theo lộ trình liên quan trong AI_RULES; giữ nguyên hai file khi áp dụng. Hồ sơ riêng và căn cứ khảo sát nằm tại [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md), không thay vai trò các quy định ở tài liệu này.
- Khi bắt đầu công việc trong repo, đọc [workflow cho AI và người mới](docs/ai/WORKFLOW.md), sau đó chỉ đọc tài liệu và phần mã liên quan. Workflow quy định cách chọn skill, kiểm chứng và bàn giao; các mục trên tiếp tục quy định chất lượng thay đổi.
- Khi triển khai roadmap, đọc [PLAN.md](docs/architecture/production-readiness/PLAN.md) và checkpoint trong [TRACKING.json](docs/architecture/production-readiness/TRACKING.json). Tiếp tục đúng ưu tiên/phụ thuộc; kiểm chứng và ghi nhận từng bước trước khi chuyển bước phụ thuộc. Chủ động tiếp tục công việc đã được giao, không hỏi lại sau mỗi bước.
- Chọn skill theo mục tiêu và công cụ thực sự khả dụng; thường một skill chuyên môn chính là đủ. Khi người dùng gọi rõ skill, đọc và áp dụng hướng dẫn đó; chỉ thêm skill khác khi có nhu cầu cụ thể. Nêu ngắn gọn skill sử dụng và lý do, không nạp toàn bộ catalog.
- Skill không thay đổi phạm vi được giao, contract, tiêu chí nghiệm thu hoặc quyền công cụ. Khi có xung đột, nêu rõ và xử lý theo chỉ dẫn đang áp dụng; nếu yêu cầu mới thay đổi thiết kế đã chốt, ghi quyết định và cập nhật tài liệu liên quan. Không âm thầm hạ yêu cầu để đạt test xanh.
- Quy trình repo phải thực hiện được cả khi không có plugin. Khi thiếu skill/công cụ, ghi rõ giới hạn và dùng phương án tương đương nếu chứng minh được cùng tiêu chí; kiểm tra bắt buộc chưa chạy vẫn là chưa đạt. Không tự cài plugin, đổi quyền, model hoặc cấu hình cá nhân để thực hiện workflow.
- Giữ một nguồn cho mỗi loại thông tin: kiến trúc ở `ARCHITECTURE.md`, quy trình ở `docs/ai/WORKFLOW.md`, công việc ở `PLAN.md`, tiến độ ở `TRACKING.json`. Dùng liên kết thay vì sao chép quy định hoặc tạo sổ tiến độ song song. Cập nhật hướng dẫn và ví dụ khi thay đổi làm chúng hết hiệu lực.

## Nguyên tắc chốt

Ưu tiên hệ thống nhỏ, rõ và dễ kiểm tra nhất mà vẫn đáp ứng đầy đủ yêu cầu. Mọi trạng thái, kết nối, tự động hóa và lớp trừu tượng mới đều cần lý do; nếu không chứng minh được là cần, hãy thử bỏ nó.
