# Danh mục phạm vi tại baseline

SHA: `41869d7d6080d1508353120bd15d482dd3d4bb91`; ngày 27/09/2026. Danh mục này dùng để tra ID, **không chứa trạng thái thực hiện**. Cập nhật tiến độ tại [TRACKING.json](TRACKING.json); hướng dẫn tại [PLAN.md](PLAN.md).

128 file trang không tương đương 128 màn hình; một file có nhiều export. 428 route là declaration, không phải số URL đã resolve. 224 route thiếu pageTarget vẫn được giữ để A07 phân loại. 154 operation là hợp đồng trong repo, không phải endpoint đã chạy backend thật. Đường dẫn route hiển thị nguyên khai báo, không tự thêm shell prefix.

## Domain

| Task | Domain | Page theo owner | API operation |
| --- | --- | ---: | ---: |
| U01 | auth | 13 | 14 |
| U02 | market | 21 | 22 |
| U03 | trading | 18 | 13 |
| U04 | wallet | 16 | 19 |
| U05 | p2p | 28 | 42 |
| U06 | dca | 5 | 5 |
| U07 | earn | 5 | 4 |
| U08 | profile | 6 | 7 |
| U09 | support | 4 | 6 |
| U10 | discovery | 1 | 2 |
| U11 | launchpad | 1 | 2 |
| U12 | arena | 2 | 4 |
| U13 | predictions | 2 | 8 |
| U14 | referral | 1 | 1 |
| U15 | admin | 3 | 5 |

`app/platform` có 2 page file riêng, theo A07.

## Toàn bộ file trang

| ID | Task | File | Trạng thái inventory baseline | Path khai báo liên quan |
| --- | --- | --- | --- | --- |
| PAGE-443237839cc6 | U06 | [src/app/pages/dca/DCAPage.tsx](../../../src/app/pages/dca/DCAPage.tsx) | integration-pending | dca |
| PAGE-036de59ef5b3 | U05 | [src/app/pages/p2p/P2PHomePage.tsx](../../../src/app/pages/p2p/P2PHomePage.tsx) | integration-pending | p2p |
| PAGE-4e8264eea3ec | A07 | [src/app/pages/system/IntegrationPendingPage.tsx](../../../src/app/pages/system/IntegrationPendingPage.tsx) | integration-pending | dca/backtester, dca/dynamic-amount, dca/multi-asset, dca/performance-compare, dca/portfolio-optimizer, dca/rebalance/:configId, dca/rebalance/config, dca/schedule/:configId, dca/schedule/config, dca/smart-rules, demo/copy-card, dev/design-system, dev/showcase, device-trust, launchpad/abi-diff/:contractId, launchpad/address-book, launchpad/batch-claim, launchpad/bridge-compare, launchpad/bridge-order/:txId, launchpad/claim-receipt/:positionId, launchpad/dca-builder, launchpad/event-log, launchpad/gas-tracker, launchpad/idobridge/:id, launchpad/limit-orders, launchpad/multisig, launchpad/notif-sound, launchpad/performance, launchpad/portfolio, launchpad/rebalance, launchpad/receipt/:subId, launchpad/risk-analytics, launchpad/staking, launchpad/swap-aggregator, launchpad/webhooks, markets/predictions/advanced-chart/:pairId, markets/predictions/data-integration, markets/predictions/event-calendar, markets/predictions/market-maker, markets/predictions/portfolio-analyzer, markets/predictions/social, markets/predictions/tournaments, p2p/compliance/aml-screening, p2p/compliance/large-transaction, p2p/compliance/source-of-funds, p2p/kyc/address, p2p/kyc/identity, p2p/kyc/selfie, p2p/kyc/video, p2p/security/anti-phishing, p2p/security/devices, p2p/security/login-history, p2p/security/suspicious-activity, profile/api, profile/api/create, profile/kyc, profile/security/alert-detail, profile/security/alert-list, profile/security/alerts/:alertId, profile/security/anti-phishing, profile/security/device-trust, profile/security/devices/:deviceId, profile/security/login-activity, profile/security/notifications, profile/security/passkey, profile/security/security-audit, profile/security/session-management, profile/security/two-factor-auth, profile/settings, profile/vip, referral/friend/:friendId, referral/history, referral/rewards, referral/rules, trade/copy-audit-log/:copyId, trade/copy-dispute-resolution, trade/copy-regulatory-disclosures, trade/copy-trading/risk-analysis, trade/copy-trading/safety, trade/copy-trading/settings, wallet/buy-crypto, wallet/gas-optimizer, wallet/health-score, wallet/multi-manager, wallet/token-approval |
| PAGE-2ff6dfead7f8 | U04 | [src/app/pages/wallet/AssetDetailPage.tsx](../../../src/app/pages/wallet/AssetDetailPage.tsx) | integration-pending | wallet/asset/:assetId |
| PAGE-8380ad159614 | U06 | [src/dev/legacy/dca/DCAOverviewDemo.tsx](../../../src/dev/legacy/dca/DCAOverviewDemo.tsx) | demo | dev/dca-overview |
| PAGE-1e496c7be6ce | A07 | [src/dev/legacy/responsive/ShellTemplatePage.tsx](../../../src/dev/legacy/responsive/ShellTemplatePage.tsx) | demo | r, r/shell |
| PAGE-5df73d9d7bc8 | U15 | [src/features/admin/pages/AdminAbTestsContractPage.tsx](../../../src/features/admin/pages/AdminAbTestsContractPage.tsx) | integration-pending | admin/abtests |
| PAGE-3381d3cc335f | U15 | [src/features/admin/pages/AdminFunnelContractPage.tsx](../../../src/features/admin/pages/AdminFunnelContractPage.tsx) | integration-pending | admin/funnels |
| PAGE-761a5b7120b0 | U15 | [src/features/admin/pages/AdminOverviewContractPage.tsx](../../../src/features/admin/pages/AdminOverviewContractPage.tsx) | integration-pending | admin, admin/analytics |
| PAGE-440a6fdccf5b | U12 | [src/features/arena/pages/ArenaContractPages.tsx](../../../src/features/arena/pages/ArenaContractPages.tsx) | integration-pending | arena/challenge/:challengeId, arena/join/:challengeId, arena/mode/:modeId |
| PAGE-9b6ee764285c | U12 | [src/features/arena/pages/ArenaDiscoveryPage.tsx](../../../src/features/arena/pages/ArenaDiscoveryPage.tsx) | integration-pending | arena |
| PAGE-fc203ab0f172 | U01 | [src/features/auth/pages/LoginPage.tsx](../../../src/features/auth/pages/LoginPage.tsx) | integration-pending | login |
| PAGE-17ba25394a51 | U01 | [src/features/auth/pages/OTPPage.tsx](../../../src/features/auth/pages/OTPPage.tsx) | integration-pending | otp |
| PAGE-80bf208ae951 | U01 | [src/features/auth/pages/PasswordChangePage.tsx](../../../src/features/auth/pages/PasswordChangePage.tsx) | integration-pending | profile/security/change-password |
| PAGE-c38da743de4d | U01 | [src/features/auth/pages/PasswordResetPages.tsx](../../../src/features/auth/pages/PasswordResetPages.tsx) | integration-pending | forgot-password, reset-password |
| PAGE-16e0615d6416 | U01 | [src/features/auth/pages/RegisterPage.tsx](../../../src/features/auth/pages/RegisterPage.tsx) | integration-pending | register |
| PAGE-98707039d228 | U01 | [src/features/auth/pages/TwoFASetupPage.tsx](../../../src/features/auth/pages/TwoFASetupPage.tsx) | integration-pending | 2fa-setup |
| PAGE-b86bf4c12ac2 | U01 | [src/features/auth/pages/Web2FASetupPage.tsx](../../../src/features/auth/pages/Web2FASetupPage.tsx) | integration-pending | 2fa-setup |
| PAGE-d3e238577d76 | U01 | [src/features/auth/pages/WebAccountLockedPage.tsx](../../../src/features/auth/pages/WebAccountLockedPage.tsx) | integration-pending | account-locked |
| PAGE-64fbd7296cdc | U01 | [src/features/auth/pages/WebAuthSuccessPage.tsx](../../../src/features/auth/pages/WebAuthSuccessPage.tsx) | integration-pending | success |
| PAGE-0dd6553ac858 | U01 | [src/features/auth/pages/WebLoginPage.tsx](../../../src/features/auth/pages/WebLoginPage.tsx) | integration-pending | login |
| PAGE-ecdaf22df407 | U01 | [src/features/auth/pages/WebOTPPage.tsx](../../../src/features/auth/pages/WebOTPPage.tsx) | integration-pending | otp |
| PAGE-43ad73895a1a | U01 | [src/features/auth/pages/WebRegisterPage.tsx](../../../src/features/auth/pages/WebRegisterPage.tsx) | integration-pending | register |
| PAGE-bb20e1f20b2b | U01 | [src/features/auth/pages/WebSessionExpiredPage.tsx](../../../src/features/auth/pages/WebSessionExpiredPage.tsx) | integration-pending | session-expired |
| PAGE-a32eca8315a9 | U06 | [src/features/dca/pages/DCAAdvancedPreviewPage.tsx](../../../src/features/dca/pages/DCAAdvancedPreviewPage.tsx) | integration-pending | dca/backtester, dca/dynamic-amount, dca/multi-asset, dca/performance-compare, dca/portfolio-optimizer, dca/rebalance/:configId, dca/rebalance/config, dca/schedule/:configId, dca/schedule/config, dca/smart-rules |
| PAGE-5a495b5a741e | U06 | [src/features/dca/pages/DCAMainPage.tsx](../../../src/features/dca/pages/DCAMainPage.tsx) | integration-pending | dca |
| PAGE-150d682e620a | U06 | [src/features/dca/pages/SavingsDCAContractPage.tsx](../../../src/features/dca/pages/SavingsDCAContractPage.tsx) | integration-pending | earn/savings/dca |
| PAGE-8eb7e2319e18 | U10 | [src/features/discovery/pages/DiscoveryContractPages.tsx](../../../src/features/discovery/pages/DiscoveryContractPages.tsx) | integration-pending | search, topic/:topicId, topics |
| PAGE-09ce6b79a07d | U07 | [src/features/earn/pages/EarnHistoryPage.tsx](../../../src/features/earn/pages/EarnHistoryPage.tsx) | integration-pending | earn/history, earn/savings/history |
| PAGE-eb99a40ed172 | U07 | [src/features/earn/pages/EarnPage.tsx](../../../src/features/earn/pages/EarnPage.tsx) | integration-pending | earn, earn/savings, earn/staking |
| PAGE-9742ca24da97 | U07 | [src/features/earn/pages/EarnTransactionPages.tsx](../../../src/features/earn/pages/EarnTransactionPages.tsx) | integration-pending | earn/savings/product/:productId, earn/savings/receipt, earn/savings/redeem/:positionId |
| PAGE-ab3eaa7ec744 | U07 | [src/features/earn/pages/SavingsContractPages.tsx](../../../src/features/earn/pages/SavingsContractPages.tsx) | integration-pending | earn/savings/comparison |
| PAGE-8c5f32cfa715 | U07 | [src/features/earn/pages/SavingsPortfolioPage.tsx](../../../src/features/earn/pages/SavingsPortfolioPage.tsx) | integration-pending | earn/savings/portfolio |
| PAGE-d4d50d51cb86 | U11 | [src/features/launchpad/pages/LaunchpadContractPages.tsx](../../../src/features/launchpad/pages/LaunchpadContractPages.tsx) | integration-pending | launchpad, launchpad/:id, launchpad/contract/:id |
| PAGE-36efe2f8adcb | U02 | [src/features/market/pages/AdvancedChartsPage.tsx](../../../src/features/market/pages/AdvancedChartsPage.tsx) | integration-pending | markets/advanced-charts, trade/advanced-chart/:pairId |
| PAGE-0f37cad9bd94 | U02 | [src/features/market/pages/MarketComparisonPage.tsx](../../../src/features/market/pages/MarketComparisonPage.tsx) | integration-pending | markets/compare |
| PAGE-62eb9cd21208 | U02 | [src/features/market/pages/MarketCorrelationPairsPage.tsx](../../../src/features/market/pages/MarketCorrelationPairsPage.tsx) | integration-pending | markets/correlations |
| PAGE-d6f1a792214b | U02 | [src/features/market/pages/MarketDepthPage.tsx](../../../src/features/market/pages/MarketDepthPage.tsx) | integration-pending | markets/depth, pair/:pairId/depth |
| PAGE-2884563662f3 | U02 | [src/features/market/pages/MarketDerivativesPage.tsx](../../../src/features/market/pages/MarketDerivativesPage.tsx) | integration-pending | markets/derivatives |
| PAGE-6d3baf120e17 | U02 | [src/features/market/pages/MarketEventCalendarPage.tsx](../../../src/features/market/pages/MarketEventCalendarPage.tsx) | integration-pending | markets/calendar |
| PAGE-c1c76490883f | U02 | [src/features/market/pages/MarketHeatmapPage.tsx](../../../src/features/market/pages/MarketHeatmapPage.tsx) | integration-pending | markets/heatmap |
| PAGE-1e5c785db58e | U02 | [src/features/market/pages/MarketHomePage.tsx](../../../src/features/market/pages/MarketHomePage.tsx) | integration-pending | home |
| PAGE-276575f273e0 | U02 | [src/features/market/pages/MarketListPage.tsx](../../../src/features/market/pages/MarketListPage.tsx) | integration-pending | markets |
| PAGE-20501e05a06f | U02 | [src/features/market/pages/MarketMoversPage.tsx](../../../src/features/market/pages/MarketMoversPage.tsx) | integration-pending | markets/movers |
| PAGE-71d65fa8658e | U02 | [src/features/market/pages/MarketNewsFeedPage.tsx](../../../src/features/market/pages/MarketNewsFeedPage.tsx) | integration-pending | markets/news |
| PAGE-7af1de50522c | U02 | [src/features/market/pages/MarketOverviewPage.tsx](../../../src/features/market/pages/MarketOverviewPage.tsx) | integration-pending | markets/overview |
| PAGE-df7c90547c18 | U02 | [src/features/market/pages/MarketPriceAlertsPage.tsx](../../../src/features/market/pages/MarketPriceAlertsPage.tsx) | integration-pending | markets/alerts |
| PAGE-00cf5683db2f | U02 | [src/features/market/pages/MarketScreenerPage.tsx](../../../src/features/market/pages/MarketScreenerPage.tsx) | integration-pending | markets/screener, scanner |
| PAGE-d3edad84b58d | U02 | [src/features/market/pages/MarketSectorsPage.tsx](../../../src/features/market/pages/MarketSectorsPage.tsx) | integration-pending | markets/sectors |
| PAGE-52f65b8503af | U02 | [src/features/market/pages/MarketSentimentPage.tsx](../../../src/features/market/pages/MarketSentimentPage.tsx) | integration-pending | markets/social-sentiment |
| PAGE-1b0551e864f2 | U02 | [src/features/market/pages/MarketSignalsPage.tsx](../../../src/features/market/pages/MarketSignalsPage.tsx) | integration-pending | markets/signals |
| PAGE-d74524dbf19f | U02 | [src/features/market/pages/PairDetailPage.tsx](../../../src/features/market/pages/PairDetailPage.tsx) | integration-pending | pair/:pairId |
| PAGE-4751c3bcdc43 | U02 | [src/features/market/pages/TokenInfoPage.tsx](../../../src/features/market/pages/TokenInfoPage.tsx) | integration-pending | pair/:pairId/info |
| PAGE-76e3cdea53ca | U02 | [src/features/market/pages/TokenUnlockSchedulePage.tsx](../../../src/features/market/pages/TokenUnlockSchedulePage.tsx) | integration-pending | markets/unlocks |
| PAGE-70a1315e9ef5 | U02 | [src/features/market/pages/WatchlistPage.tsx](../../../src/features/market/pages/WatchlistPage.tsx) | integration-pending | markets/watchlist |
| PAGE-75bc8741b761 | U05 | [src/features/p2p/pages/P2P2FASettingsPage.tsx](../../../src/features/p2p/pages/P2P2FASettingsPage.tsx) | integration-pending | p2p/security/2fa |
| PAGE-1af8b3aa90b0 | U05 | [src/features/p2p/pages/P2PAchievementsPage.tsx](../../../src/features/p2p/pages/P2PAchievementsPage.tsx) | integration-pending | p2p/achievements |
| PAGE-20f21352affa | U05 | [src/features/p2p/pages/P2PAdAnalyticsPage.tsx](../../../src/features/p2p/pages/P2PAdAnalyticsPage.tsx) | integration-pending | p2p/ad-analytics/:id |
| PAGE-1a59bd875a84 | U05 | [src/features/p2p/pages/P2PAdDetailContractPage.tsx](../../../src/features/p2p/pages/P2PAdDetailContractPage.tsx) | integration-pending | p2p/ad/:id |
| PAGE-ada4341befda | U05 | [src/features/p2p/pages/P2PBlacklistAddPage.tsx](../../../src/features/p2p/pages/P2PBlacklistAddPage.tsx) | integration-pending | p2p/blacklist/add |
| PAGE-ddbb88dfac4c | U05 | [src/features/p2p/pages/P2PBlacklistPage.tsx](../../../src/features/p2p/pages/P2PBlacklistPage.tsx) | integration-pending | p2p/blacklist |
| PAGE-8bb7d016ec6f | U05 | [src/features/p2p/pages/P2PChatPage.tsx](../../../src/features/p2p/pages/P2PChatPage.tsx) | integration-pending | p2p/chat/:orderId |
| PAGE-046661c1ebbf | U05 | [src/features/p2p/pages/P2PCreateAdContractPage.tsx](../../../src/features/p2p/pages/P2PCreateAdContractPage.tsx) | integration-pending | p2p/create, p2p/create-offer |
| PAGE-c1d85e0ab49e | U05 | [src/features/p2p/pages/P2PDashboardPage.tsx](../../../src/features/p2p/pages/P2PDashboardPage.tsx) | integration-pending | p2p/dashboard |
| PAGE-f272425548b6 | U05 | [src/features/p2p/pages/P2PDisputeDetailPage.tsx](../../../src/features/p2p/pages/P2PDisputeDetailPage.tsx) | integration-pending | p2p/dispute/detail/:id |
| PAGE-1fd122902221 | U05 | [src/features/p2p/pages/P2PDisputesPage.tsx](../../../src/features/p2p/pages/P2PDisputesPage.tsx) | integration-pending | p2p/disputes |
| PAGE-3df5fa285478 | U05 | [src/features/p2p/pages/P2PEscrowDetailPage.tsx](../../../src/features/p2p/pages/P2PEscrowDetailPage.tsx) | integration-pending | p2p/escrow/:orderId, p2p/order/:orderId |
| PAGE-6f21b5bde22e | U05 | [src/features/p2p/pages/P2PExpressConfirmPage.tsx](../../../src/features/p2p/pages/P2PExpressConfirmPage.tsx) | integration-pending | p2p/express/confirm |
| PAGE-7af5a62fda24 | U05 | [src/features/p2p/pages/P2PExpressPage.tsx](../../../src/features/p2p/pages/P2PExpressPage.tsx) | integration-pending | p2p/express |
| PAGE-21704b52f87e | U05 | [src/features/p2p/pages/P2PFraudPreventionPage.tsx](../../../src/features/p2p/pages/P2PFraudPreventionPage.tsx) | integration-pending | p2p/fraud-prevention |
| PAGE-faaee5732063 | U05 | [src/features/p2p/pages/P2PFrontendStatusPages.tsx](../../../src/features/p2p/pages/P2PFrontendStatusPages.tsx) | integration-pending | p2p/insurance, p2p/insurance-fund, p2p/insurance/contribution-history, p2p/kyc/requirements, p2p/kyc/status, p2p/limits, p2p/security/center, p2p/wallet |
| PAGE-45f4a12e6b27 | U05 | [src/features/p2p/pages/P2PGuidePage.tsx](../../../src/features/p2p/pages/P2PGuidePage.tsx) | integration-pending | p2p/guide |
| PAGE-f82222e1503f | U05 | [src/features/p2p/pages/P2PMarketplacePage.tsx](../../../src/features/p2p/pages/P2PMarketplacePage.tsx) | integration-pending | p2p |
| PAGE-e8f585dbb52f | U05 | [src/features/p2p/pages/P2PMerchantProfilePage.tsx](../../../src/features/p2p/pages/P2PMerchantProfilePage.tsx) | integration-pending | p2p/merchant/:merchantId |
| PAGE-2c16d028751b | U05 | [src/features/p2p/pages/P2PMyAdsContractPage.tsx](../../../src/features/p2p/pages/P2PMyAdsContractPage.tsx) | integration-pending | p2p/my-ads |
| PAGE-07573ad831ae | U05 | [src/features/p2p/pages/P2POrderActionPages.tsx](../../../src/features/p2p/pages/P2POrderActionPages.tsx) | integration-pending | p2p/order/cancel/:orderId, p2p/order/proof/:orderId, p2p/order/rate/:orderId, p2p/order/timeline/:orderId |
| PAGE-434c3b950094 | U05 | [src/features/p2p/pages/P2POrdersContractPage.tsx](../../../src/features/p2p/pages/P2POrdersContractPage.tsx) | integration-pending | p2p/my-orders, p2p/order-room |
| PAGE-91b28f38e9a2 | U05 | [src/features/p2p/pages/P2PPaymentMethodAddPage.tsx](../../../src/features/p2p/pages/P2PPaymentMethodAddPage.tsx) | integration-pending | p2p/payment-method/add |
| PAGE-1438bcad5075 | U05 | [src/features/p2p/pages/P2PPaymentMethodsPage.tsx](../../../src/features/p2p/pages/P2PPaymentMethodsPage.tsx) | integration-pending | p2p/payment-methods |
| PAGE-c4f3955c0d12 | U05 | [src/features/p2p/pages/P2PReportMerchantPage.tsx](../../../src/features/p2p/pages/P2PReportMerchantPage.tsx) | integration-pending | p2p/report/:merchantId |
| PAGE-4b1beb6efee4 | U05 | [src/features/p2p/pages/P2PReviewsPage.tsx](../../../src/features/p2p/pages/P2PReviewsPage.tsx) | integration-pending | p2p/reviews |
| PAGE-087748ce2025 | U05 | [src/features/p2p/pages/P2PTradingLevelPage.tsx](../../../src/features/p2p/pages/P2PTradingLevelPage.tsx) | integration-pending | p2p/trading-level |
| PAGE-ecb8a4b22aa5 | U13 | [src/features/predictions/pages/PredictionContractPages.tsx](../../../src/features/predictions/pages/PredictionContractPages.tsx) | integration-pending | activity, breaking, event/:eventId, leaderboard, portfolio, predictions, predictions/event/:eventId, profile/predictions, receipt/:orderId, rewards, search |
| PAGE-c942cdec23ef | U13 | [src/features/predictions/pages/PredictionRiskCalculatorPage.tsx](../../../src/features/predictions/pages/PredictionRiskCalculatorPage.tsx) | integration-pending | markets/predictions/risk-calculator |
| PAGE-d2b8d8e71d67 | U08 | [src/features/profile/pages/ActivityLogContractPage.tsx](../../../src/features/profile/pages/ActivityLogContractPage.tsx) | integration-pending | profile/activity |
| PAGE-8c877c0b4475 | U08 | [src/features/profile/pages/DeviceManagementContractPage.tsx](../../../src/features/profile/pages/DeviceManagementContractPage.tsx) | integration-pending | profile/devices |
| PAGE-7112f9cd5292 | U08 | [src/features/profile/pages/EditProfileContractPage.tsx](../../../src/features/profile/pages/EditProfileContractPage.tsx) | integration-pending | profile/edit |
| PAGE-6455fd779240 | U08 | [src/features/profile/pages/ProfileContractPage.tsx](../../../src/features/profile/pages/ProfileContractPage.tsx) | integration-pending | profile |
| PAGE-3ff860a84787 | U08 | [src/features/profile/pages/SecurityContractPage.tsx](../../../src/features/profile/pages/SecurityContractPage.tsx) | integration-pending | profile/security |
| PAGE-8c397c26cd40 | U08 | [src/features/profile/pages/SubAccountContractPage.tsx](../../../src/features/profile/pages/SubAccountContractPage.tsx) | integration-pending | profile/sub-accounts |
| PAGE-e3d76c6c8e75 | U14 | [src/features/referral/pages/ReferralContractPage.tsx](../../../src/features/referral/pages/ReferralContractPage.tsx) | integration-pending | referral |
| PAGE-9b061b9ccade | U09 | [src/features/support/pages/HelpCenterContractPage.tsx](../../../src/features/support/pages/HelpCenterContractPage.tsx) | integration-pending | support/help |
| PAGE-6ee46004f7ea | U09 | [src/features/support/pages/NewsContractPage.tsx](../../../src/features/support/pages/NewsContractPage.tsx) | integration-pending | news, support/announcements |
| PAGE-b358e1cb5c6c | U09 | [src/features/support/pages/NotificationsContractPage.tsx](../../../src/features/support/pages/NotificationsContractPage.tsx) | integration-pending | notifications |
| PAGE-f973d72a1be5 | U09 | [src/features/support/pages/SupportContractPage.tsx](../../../src/features/support/pages/SupportContractPage.tsx) | integration-pending | support |
| PAGE-ec2ec398e276 | U03 | [src/features/trading/pages/ActiveCopiesContractPage.tsx](../../../src/features/trading/pages/ActiveCopiesContractPage.tsx) | integration-pending | trade/copy-trading/active, trade/copy/active |
| PAGE-d4c7365bfd65 | U03 | [src/features/trading/pages/CopyConfigurationContractPage.tsx](../../../src/features/trading/pages/CopyConfigurationContractPage.tsx) | integration-pending | trade/copy-provider/:providerId/configuration, trade/copy/provider/:providerId/configuration |
| PAGE-213e3f112c66 | U03 | [src/features/trading/pages/CopyConfirmationContractPage.tsx](../../../src/features/trading/pages/CopyConfirmationContractPage.tsx) | integration-pending | trade/copy-provider/:providerId/confirmation, trade/copy/provider/:providerId/confirmation |
| PAGE-6dcc916bd89f | U03 | [src/features/trading/pages/CopyEducationPage.tsx](../../../src/features/trading/pages/CopyEducationPage.tsx) | integration-pending | trade/copy-trading/education, trade/copy/education |
| PAGE-46f656aa315f | U03 | [src/features/trading/pages/CopyFrontendStatusPages.tsx](../../../src/features/trading/pages/CopyFrontendStatusPages.tsx) | integration-pending | trade/copy-performance/:copyId/attribution, trade/copy-provider-apply, trade/copy-provider-governance, trade/copy-safety-center |
| PAGE-51bff81e3623 | U03 | [src/features/trading/pages/CopyProviderDetailContractPage.tsx](../../../src/features/trading/pages/CopyProviderDetailContractPage.tsx) | integration-pending | trade/copy-provider/:providerId, trade/copy/provider/:providerId |
| PAGE-c57e5c026e26 | U03 | [src/features/trading/pages/CopyTradingPage.tsx](../../../src/features/trading/pages/CopyTradingPage.tsx) | integration-pending | trade/copy, trade/copy-trading, trade/copy-trading/v2 |
| PAGE-67b2c75dd6c9 | U03 | [src/features/trading/pages/OpenPositionsPage.tsx](../../../src/features/trading/pages/OpenPositionsPage.tsx) | integration-pending | trade/positions |
| PAGE-7fbc8a0cd4ef | U03 | [src/features/trading/pages/OrderReceiptPage.tsx](../../../src/features/trading/pages/OrderReceiptPage.tsx) | integration-pending | trade/order-receipt |
| PAGE-13ce4c696e14 | U03 | [src/features/trading/pages/OrdersHistoryPage.tsx](../../../src/features/trading/pages/OrdersHistoryPage.tsx) | integration-pending | trade/orders, trade/orders-history |
| PAGE-4205568beac5 | U03 | [src/features/trading/pages/PreCopyAssessmentContractPage.tsx](../../../src/features/trading/pages/PreCopyAssessmentContractPage.tsx) | integration-pending | trade/copy-provider/:providerId/assessment, trade/copy/provider/:providerId/assessment |
| PAGE-89af199d0372 | U03 | [src/features/trading/pages/ProviderComparisonContractPage.tsx](../../../src/features/trading/pages/ProviderComparisonContractPage.tsx) | integration-pending | trade/copy-trading/comparison |
| PAGE-2453089d52e0 | U03 | [src/features/trading/pages/ProviderLeaderboardPage.tsx](../../../src/features/trading/pages/ProviderLeaderboardPage.tsx) | integration-pending | trade/copy-trading/leaderboard |
| PAGE-14dffba0ed1f | U03 | [src/features/trading/pages/TradeAnalyticsContractPage.tsx](../../../src/features/trading/pages/TradeAnalyticsContractPage.tsx) | integration-pending | trade/analytics |
| PAGE-8b6150d792c2 | U03 | [src/features/trading/pages/TradePage.tsx](../../../src/features/trading/pages/TradePage.tsx) | integration-pending | trade, trade/:pairId |
| PAGE-6a7de2262e3a | U03 | [src/features/trading/pages/TradeSettingsPage.tsx](../../../src/features/trading/pages/TradeSettingsPage.tsx) | integration-pending | trade/settings |
| PAGE-c085aa817bb1 | U03 | [src/features/trading/pages/TraderProfilePage.tsx](../../../src/features/trading/pages/TraderProfilePage.tsx) | integration-pending | trade/trader/:traderId |
| PAGE-5a7128227569 | U03 | [src/features/trading/pages/WebCopyPerformancePage.tsx](../../../src/features/trading/pages/WebCopyPerformancePage.tsx) | integration-pending | trade/copy-performance/:copyId, trade/copy/performance/:copyId |
| PAGE-20aae3583ef2 | U04 | [src/features/wallet/pages/AddressAddPage.tsx](../../../src/features/wallet/pages/AddressAddPage.tsx) | integration-pending | wallet/address-book/add |
| PAGE-44ecf5a1e58f | U04 | [src/features/wallet/pages/AddressBookPage.tsx](../../../src/features/wallet/pages/AddressBookPage.tsx) | integration-pending | address-book, wallet/address-book |
| PAGE-2c6f57e69f63 | U04 | [src/features/wallet/pages/AssetDetailPage.tsx](../../../src/features/wallet/pages/AssetDetailPage.tsx) | integration-pending | wallet/asset/:assetId |
| PAGE-381397ee27e7 | U04 | [src/features/wallet/pages/DustConverterPage.tsx](../../../src/features/wallet/pages/DustConverterPage.tsx) | integration-pending | wallet/dust-converter |
| PAGE-787c9045024e | U04 | [src/features/wallet/pages/NetworkStatusPage.tsx](../../../src/features/wallet/pages/NetworkStatusPage.tsx) | integration-pending | wallet/network-status |
| PAGE-1861ccc38050 | U04 | [src/features/wallet/pages/PendingDepositsPage.tsx](../../../src/features/wallet/pages/PendingDepositsPage.tsx) | integration-pending | wallet/pending-deposits |
| PAGE-961fc3df53be | U04 | [src/features/wallet/pages/PortfolioAnalyticsContractPage.tsx](../../../src/features/wallet/pages/PortfolioAnalyticsContractPage.tsx) | integration-pending | markets/portfolio-tracker, portfolio/analytics, wallet/portfolio-analytics |
| PAGE-1d8b455d35df | U04 | [src/features/wallet/pages/TransactionDetailPage.tsx](../../../src/features/wallet/pages/TransactionDetailPage.tsx) | integration-pending | wallet/transaction/:txId |
| PAGE-eb38b94e973e | U04 | [src/features/wallet/pages/WalletDepositContractPage.tsx](../../../src/features/wallet/pages/WalletDepositContractPage.tsx) | integration-pending | wallet/deposit, wallet/deposit/:asset |
| PAGE-7dea20550156 | U04 | [src/features/wallet/pages/WalletOverviewContractPage.tsx](../../../src/features/wallet/pages/WalletOverviewContractPage.tsx) | integration-pending | wallet |
| PAGE-70a1c929873d | U04 | [src/features/wallet/pages/WalletTransactionHistoryContractPage.tsx](../../../src/features/wallet/pages/WalletTransactionHistoryContractPage.tsx) | integration-pending | wallet/history |
| PAGE-addc047e72ed | U04 | [src/features/wallet/pages/WalletTransferContractPage.tsx](../../../src/features/wallet/pages/WalletTransferContractPage.tsx) | integration-pending | wallet/transfer |
| PAGE-e4ddc60fea97 | U04 | [src/features/wallet/pages/WebWithdrawalWhitelistPage.tsx](../../../src/features/wallet/pages/WebWithdrawalWhitelistPage.tsx) | integration-pending | profile/security/withdrawal-whitelist |
| PAGE-3e89305ac3c3 | U04 | [src/features/wallet/pages/WithdrawPage.tsx](../../../src/features/wallet/pages/WithdrawPage.tsx) | integration-pending | wallet/withdraw, wallet/withdraw/:asset |
| PAGE-33bfb88def5f | U04 | [src/features/wallet/pages/WithdrawalLimitsPage.tsx](../../../src/features/wallet/pages/WithdrawalLimitsPage.tsx) | integration-pending | wallet/limits |

## Toàn bộ khai báo route

`A07` nghĩa là chưa có mapping page chắc chắn từ inventory, không có nghĩa route bị lỗi. Component IntegrationPendingPage trực tiếp chỉ là một nhóm; alias cần đọc source. Mọi dòng cần concrete URL/classification/scenario trong sổ.

| ID | Task ban đầu | Path | Component / slot | File khai báo | Target page / dev |
| --- | --- | --- | --- | --- | --- |
| ROUTE-90e3f3b33e2b | A07 | `/` | RootLayout | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-b28612957bf6 | U01 | `2fa-setup` | TwoFASetupPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/auth/pages/TwoFASetupPage.tsx](../../../src/features/auth/pages/TwoFASetupPage.tsx) |
| ROUTE-e836f6cbe6eb | U01 | `2fa-setup` | Web2FASetupPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/auth/pages/Web2FASetupPage.tsx](../../../src/features/auth/pages/Web2FASetupPage.tsx) |
| ROUTE-094a1e1d228e | U01 | `account-locked` | WebAccountLockedPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/auth/pages/WebAccountLockedPage.tsx](../../../src/features/auth/pages/WebAccountLockedPage.tsx) |
| ROUTE-07036e7b5d31 | U13 | `activity` | PredictionsGlobalActivityPage / activity | [src/features/predictions/routes.ts](../../../src/features/predictions/routes.ts) | [src/features/predictions/pages/PredictionContractPages.tsx](../../../src/features/predictions/pages/PredictionContractPages.tsx) |
| ROUTE-d8661f09f354 | U04 | `address-book` | WebAddressBookPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/wallet/pages/AddressBookPage.tsx](../../../src/features/wallet/pages/AddressBookPage.tsx) |
| ROUTE-d19399b9b294 | U15 | `admin` | AdminHome / home | [src/features/admin/routes.ts](../../../src/features/admin/routes.ts) | [src/features/admin/pages/AdminOverviewContractPage.tsx](../../../src/features/admin/pages/AdminOverviewContractPage.tsx) · dev-only |
| ROUTE-45bd789a3fba | U15 | `admin/abtests` | ABTestDashboard / abTests | [src/features/admin/routes.ts](../../../src/features/admin/routes.ts) | [src/features/admin/pages/AdminAbTestsContractPage.tsx](../../../src/features/admin/pages/AdminAbTestsContractPage.tsx) · dev-only |
| ROUTE-bd287cd1a67c | U15 | `admin/analytics` | AnalyticsDashboard / analytics | [src/features/admin/routes.ts](../../../src/features/admin/routes.ts) | [src/features/admin/pages/AdminOverviewContractPage.tsx](../../../src/features/admin/pages/AdminOverviewContractPage.tsx) · dev-only |
| ROUTE-2382039b546f | U15 | `admin/funnels` | FunnelDashboard / funnel | [src/features/admin/routes.ts](../../../src/features/admin/routes.ts) | [src/features/admin/pages/AdminFunnelContractPage.tsx](../../../src/features/admin/pages/AdminFunnelContractPage.tsx) · dev-only |
| ROUTE-f1d949a1db1b | A07 | `arena` | ArenaHomePage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-076da8bdac7d | U12 | `arena` | WebArenaHomePage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/arena/pages/ArenaDiscoveryPage.tsx](../../../src/features/arena/pages/ArenaDiscoveryPage.tsx) · dev-only |
| ROUTE-89eea1e814fd | A07 | `arena/blocked` | ArenaBlockedUsersPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-78cd7bfe5085 | A07 | `arena/bridge` | ArenaPredictionBridgeFoundationPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-50b90d76bb05 | U12 | `arena/challenge/:challengeId` | ArenaChallengeDetailPage / challenge | [src/features/arena/routes.ts](../../../src/features/arena/routes.ts) | [src/features/arena/pages/ArenaContractPages.tsx](../../../src/features/arena/pages/ArenaContractPages.tsx) |
| ROUTE-de74d40e018a | A07 | `arena/creator/:creatorId` | ArenaCreatorPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-020e9a5cef00 | A07 | `arena/ecosystem` | ConnectedEcosystemProductionPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-4fb31a0c1ab0 | A07 | `arena/flow-map` | ArenaFlowMapPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-39269ae12c99 | A07 | `arena/guide` | ArenaGuidePage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-10872089ef72 | U12 | `arena/join/:challengeId` | ArenaContractPages / join | [src/features/arena/routes.ts](../../../src/features/arena/routes.ts) | [src/features/arena/pages/ArenaContractPages.tsx](../../../src/features/arena/pages/ArenaContractPages.tsx) |
| ROUTE-8f0b44f6da0e | A07 | `arena/leaderboard` | ArenaLeaderboardPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-5def0eedc705 | A07 | `arena/ledger` | ArenaPointsLedgerPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-eb23b7bde14c | A07 | `arena/ledger/entry/:entryId` | ArenaPointsEntryDetailPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-146c88bac101 | U12 | `arena/mode/:modeId` | ArenaModeDetailPage / mode | [src/features/arena/routes.ts](../../../src/features/arena/routes.ts) | [src/features/arena/pages/ArenaContractPages.tsx](../../../src/features/arena/pages/ArenaContractPages.tsx) |
| ROUTE-a9861d7bcf6c | A07 | `arena/my` | MyArenaPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-b732d4d1cba3 | A07 | `arena/my-reports` | MyArenaReportsPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-189665d38d4e | A07 | `arena/points` | ArenaPointsPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-e76202ea2dcd | A07 | `arena/production` | ArenaProductionReadyPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-f4a012f5576a | A07 | `arena/report/:caseId` | ArenaReportCasePage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-974fa58551ae | A07 | `arena/resolution` | ArenaResolutionCenterPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-393a4ac5697c | A07 | `arena/safety` | ArenaSafetyCenterPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-e8c84d849652 | A07 | `arena/studio` | ArenaStudioPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-6e338dff9c0e | A07 | `arena/studio/governance` | ArenaGovernanceGatePage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-ef8a6807445f | A07 | `arena/studio/presets` | ArenaUniversalPresetLibraryPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-b2eb63b9a840 | A07 | `arena/studio/smart-rules` | ArenaSmartRuleBuilderPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-36bfa8c68874 | A07 | `arena/trust/:userId` | ArenaTrustBreakdownPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-94e6ffe20f31 | A07 | `arena/verified` | VerifiedChallengesPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-35776dfb8515 | A07 | `auth` | AuthLayout | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-dc09822db3a0 | U13 | `breaking` | PredictionsBreakingPage / breaking | [src/features/predictions/routes.ts](../../../src/features/predictions/routes.ts) | [src/features/predictions/pages/PredictionContractPages.tsx](../../../src/features/predictions/pages/PredictionContractPages.tsx) |
| ROUTE-f71f8ac87953 | A07 | `cross-module-analytics` | CrossModuleAnalytics | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-808a624106b9 | U06 | `dca` | DCAPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/app/pages/dca/DCAPage.tsx](../../../src/app/pages/dca/DCAPage.tsx) |
| ROUTE-7e7bbeeb09ca | U06 | `dca/backtester` | DCAAdvancedPreviewPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/dca/pages/DCAAdvancedPreviewPage.tsx](../../../src/features/dca/pages/DCAAdvancedPreviewPage.tsx) · dev-only |
| ROUTE-6dadbb2200ec | A07 | `dca/backtester` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-cd89dce2f8b0 | U06 | `dca/dynamic-amount` | DCAAdvancedPreviewPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/dca/pages/DCAAdvancedPreviewPage.tsx](../../../src/features/dca/pages/DCAAdvancedPreviewPage.tsx) · dev-only |
| ROUTE-87076d5b6049 | A07 | `dca/dynamic-amount` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-1a92f6ba7606 | U06 | `dca/multi-asset` | DCAAdvancedPreviewPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/dca/pages/DCAAdvancedPreviewPage.tsx](../../../src/features/dca/pages/DCAAdvancedPreviewPage.tsx) · dev-only |
| ROUTE-5258032d170f | A07 | `dca/multi-asset` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-09baf65c5116 | U06 | `dca/performance-compare` | DCAAdvancedPreviewPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/dca/pages/DCAAdvancedPreviewPage.tsx](../../../src/features/dca/pages/DCAAdvancedPreviewPage.tsx) · dev-only |
| ROUTE-1e5e335fbae8 | A07 | `dca/performance-compare` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-824e31f309d7 | U06 | `dca/portfolio-optimizer` | DCAAdvancedPreviewPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/dca/pages/DCAAdvancedPreviewPage.tsx](../../../src/features/dca/pages/DCAAdvancedPreviewPage.tsx) · dev-only |
| ROUTE-f8eaaf9f24ca | A07 | `dca/portfolio-optimizer` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-b45318c002ab | U06 | `dca/rebalance/:configId` | DCAAdvancedPreviewPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/dca/pages/DCAAdvancedPreviewPage.tsx](../../../src/features/dca/pages/DCAAdvancedPreviewPage.tsx) · dev-only |
| ROUTE-6746ba723fa7 | A07 | `dca/rebalance/:configId` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-d7fb0de1895b | U06 | `dca/rebalance/config` | DCAAdvancedPreviewPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/dca/pages/DCAAdvancedPreviewPage.tsx](../../../src/features/dca/pages/DCAAdvancedPreviewPage.tsx) · dev-only |
| ROUTE-a379c94f8908 | A07 | `dca/rebalance/config` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-df2f467245f7 | U06 | `dca/schedule/:configId` | DCAAdvancedPreviewPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/dca/pages/DCAAdvancedPreviewPage.tsx](../../../src/features/dca/pages/DCAAdvancedPreviewPage.tsx) · dev-only |
| ROUTE-c47c306761cc | A07 | `dca/schedule/:configId` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-12da7198971e | U06 | `dca/schedule/config` | DCAAdvancedPreviewPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/dca/pages/DCAAdvancedPreviewPage.tsx](../../../src/features/dca/pages/DCAAdvancedPreviewPage.tsx) · dev-only |
| ROUTE-7f89177f5d7d | A07 | `dca/schedule/config` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-73343a5c4564 | U06 | `dca/smart-rules` | DCAAdvancedPreviewPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/dca/pages/DCAAdvancedPreviewPage.tsx](../../../src/features/dca/pages/DCAAdvancedPreviewPage.tsx) · dev-only |
| ROUTE-b4dc7af66d9f | A07 | `dca/smart-rules` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-b185812ceb9b | A07 | `demo/copy-card` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve · dev-only |
| ROUTE-53bd13532ae7 | U06 | `dev/dca-overview` | DCAOverviewDemo | [src/app/routes.ts](../../../src/app/routes.ts) | [src/dev/legacy/dca/DCAOverviewDemo.tsx](../../../src/dev/legacy/dca/DCAOverviewDemo.tsx) · dev-only |
| ROUTE-ae6d6c444ceb | A07 | `dev/design-system` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve · dev-only |
| ROUTE-5b145fc66e58 | A07 | `dev/performance-monitor` | PerformanceMonitor | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve · dev-only |
| ROUTE-60df5a2db9b3 | A07 | `dev/route-checker` | RouteChecker | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve · dev-only |
| ROUTE-074255892b13 | A07 | `dev/showcase` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve · dev-only |
| ROUTE-ef6ce9f11fa4 | A07 | `device-trust` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-e52b92feb2d8 | U07 | `earn` | StakingPage | [src/features/earn/routes.ts](../../../src/features/earn/routes.ts) | [src/features/earn/pages/EarnPage.tsx](../../../src/features/earn/pages/EarnPage.tsx) |
| ROUTE-248b571acbf6 | U07 | `earn/history` | StakingHistoryPage | [src/features/earn/routes.ts](../../../src/features/earn/routes.ts) | [src/features/earn/pages/EarnHistoryPage.tsx](../../../src/features/earn/pages/EarnHistoryPage.tsx) |
| ROUTE-3eda02587fb7 | U07 | `earn/savings` | WebEarnSavingsPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/earn/pages/EarnPage.tsx](../../../src/features/earn/pages/EarnPage.tsx) |
| ROUTE-d9f92b51253a | U07 | `earn/savings` | SavingsPage | [src/features/earn/routes.ts](../../../src/features/earn/routes.ts) | [src/features/earn/pages/EarnPage.tsx](../../../src/features/earn/pages/EarnPage.tsx) |
| ROUTE-6fb20ebd8b9f | U07 | `earn/savings/comparison` | SavingsComparisonPage | [src/features/earn/routes.ts](../../../src/features/earn/routes.ts) | [src/features/earn/pages/SavingsContractPages.tsx](../../../src/features/earn/pages/SavingsContractPages.tsx) |
| ROUTE-eecd0227de89 | U06 | `earn/savings/dca` | SavingsDCAPage | [src/features/dca/routes.ts](../../../src/features/dca/routes.ts) | [src/features/dca/pages/SavingsDCAContractPage.tsx](../../../src/features/dca/pages/SavingsDCAContractPage.tsx) |
| ROUTE-a826ec50d0c3 | U07 | `earn/savings/history` | SavingsHistoryPage | [src/features/earn/routes.ts](../../../src/features/earn/routes.ts) | [src/features/earn/pages/EarnHistoryPage.tsx](../../../src/features/earn/pages/EarnHistoryPage.tsx) |
| ROUTE-e440c31a0c9d | U07 | `earn/savings/portfolio` | SavingsPortfolioPage | [src/features/earn/routes.ts](../../../src/features/earn/routes.ts) | [src/features/earn/pages/SavingsPortfolioPage.tsx](../../../src/features/earn/pages/SavingsPortfolioPage.tsx) |
| ROUTE-284f3727acb3 | U07 | `earn/savings/product/:productId` | EarnProductDetailPage | [src/features/earn/routes.ts](../../../src/features/earn/routes.ts) | [src/features/earn/pages/EarnTransactionPages.tsx](../../../src/features/earn/pages/EarnTransactionPages.tsx) |
| ROUTE-b51421735ef5 | U07 | `earn/savings/receipt` | EarnReceiptPage | [src/features/earn/routes.ts](../../../src/features/earn/routes.ts) | [src/features/earn/pages/EarnTransactionPages.tsx](../../../src/features/earn/pages/EarnTransactionPages.tsx) |
| ROUTE-5c0c1352beba | U07 | `earn/savings/redeem/:positionId` | EarnRedeemPage | [src/features/earn/routes.ts](../../../src/features/earn/routes.ts) | [src/features/earn/pages/EarnTransactionPages.tsx](../../../src/features/earn/pages/EarnTransactionPages.tsx) |
| ROUTE-4db02e4365fd | U07 | `earn/staking` | WebEarnStakingPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/earn/pages/EarnPage.tsx](../../../src/features/earn/pages/EarnPage.tsx) |
| ROUTE-5a6516b7a27b | U07 | `earn/staking` | StakingPage | [src/features/earn/routes.ts](../../../src/features/earn/routes.ts) | [src/features/earn/pages/EarnPage.tsx](../../../src/features/earn/pages/EarnPage.tsx) |
| ROUTE-c922fc8532a1 | A07 | `enterprise-states` | EnterpriseStatesPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-8524f4f11365 | U13 | `event/:eventId` | PredictionEventDetailPage / event | [src/features/predictions/routes.ts](../../../src/features/predictions/routes.ts) | [src/features/predictions/pages/PredictionContractPages.tsx](../../../src/features/predictions/pages/PredictionContractPages.tsx) |
| ROUTE-4a0dfa8a2088 | U01 | `forgot-password` | ForgotPasswordPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/auth/pages/PasswordResetPages.tsx](../../../src/features/auth/pages/PasswordResetPages.tsx) |
| ROUTE-764ca832a1d4 | U01 | `forgot-password` | WebForgotPasswordPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/auth/pages/PasswordResetPages.tsx](../../../src/features/auth/pages/PasswordResetPages.tsx) |
| ROUTE-6b14be701225 | U02 | `home` | HomePage / HomePage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/market/pages/MarketHomePage.tsx](../../../src/features/market/pages/MarketHomePage.tsx) |
| ROUTE-104d3393afd5 | U11 | `launchpad` | LaunchpadPage | [src/features/launchpad/routes.ts](../../../src/features/launchpad/routes.ts) | [src/features/launchpad/pages/LaunchpadContractPages.tsx](../../../src/features/launchpad/pages/LaunchpadContractPages.tsx) |
| ROUTE-226deadf1161 | U11 | `launchpad/:id` | LaunchpadProjectPage | [src/features/launchpad/routes.ts](../../../src/features/launchpad/routes.ts) | [src/features/launchpad/pages/LaunchpadContractPages.tsx](../../../src/features/launchpad/pages/LaunchpadContractPages.tsx) |
| ROUTE-58a8ad79587f | A07 | `launchpad/abi-diff/:contractId` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-6944bc26605c | A07 | `launchpad/address-book` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-0c4165b664b3 | A07 | `launchpad/batch-claim` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-8077bc76ddb9 | A07 | `launchpad/bridge-compare` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-1334d1ec8422 | A07 | `launchpad/bridge-order/:txId` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-1b087a435847 | A07 | `launchpad/claim-receipt/:positionId` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-c8cacb608e53 | U11 | `launchpad/contract/:id` | LaunchpadProjectPage | [src/features/launchpad/routes.ts](../../../src/features/launchpad/routes.ts) | [src/features/launchpad/pages/LaunchpadContractPages.tsx](../../../src/features/launchpad/pages/LaunchpadContractPages.tsx) |
| ROUTE-20881bd47a7c | A07 | `launchpad/dca-builder` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-a4e8ba9a3de3 | A07 | `launchpad/event-log` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-8a6a3de88195 | A07 | `launchpad/gas-tracker` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-508f24174a70 | A07 | `launchpad/idobridge/:id` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-074c3a881c79 | A07 | `launchpad/limit-orders` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-12504cded8b0 | A07 | `launchpad/multisig` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-2952332b1d65 | A07 | `launchpad/notif-sound` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-bd7d1f020c8b | A07 | `launchpad/performance` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-b8119b7680bf | A07 | `launchpad/portfolio` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-b5b09757e983 | A07 | `launchpad/rebalance` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-b15840052cec | A07 | `launchpad/receipt/:subId` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-494d55f99223 | A07 | `launchpad/risk-analytics` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-f04727fa10f3 | A07 | `launchpad/staking` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-d75c49a9ea41 | A07 | `launchpad/swap-aggregator` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-0d27836181d7 | A07 | `launchpad/webhooks` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-98b56b7de846 | U13 | `leaderboard` | PredictionsLeaderboardPage / leaderboard | [src/features/predictions/routes.ts](../../../src/features/predictions/routes.ts) | [src/features/predictions/pages/PredictionContractPages.tsx](../../../src/features/predictions/pages/PredictionContractPages.tsx) |
| ROUTE-100cc1dbac0e | U01 | `login` | LoginPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/auth/pages/LoginPage.tsx](../../../src/features/auth/pages/LoginPage.tsx) |
| ROUTE-1f4f526bb861 | U01 | `login` | WebLoginPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/auth/pages/WebLoginPage.tsx](../../../src/features/auth/pages/WebLoginPage.tsx) |
| ROUTE-626b52f4ed7c | U02 | `markets` | MarketListPage / MarketListPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/market/pages/MarketListPage.tsx](../../../src/features/market/pages/MarketListPage.tsx) |
| ROUTE-9e06fa1a221c | U02 | `markets/advanced-charts` | AdvancedChartsPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/AdvancedChartsPage.tsx](../../../src/features/market/pages/AdvancedChartsPage.tsx) |
| ROUTE-6937d5bbd2a3 | U02 | `markets/alerts` | MarketPriceAlertsPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketPriceAlertsPage.tsx](../../../src/features/market/pages/MarketPriceAlertsPage.tsx) |
| ROUTE-46670dac178f | U02 | `markets/calendar` | MarketEventCalendarPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketEventCalendarPage.tsx](../../../src/features/market/pages/MarketEventCalendarPage.tsx) |
| ROUTE-65012b8fd047 | U02 | `markets/compare` | MarketComparisonPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketComparisonPage.tsx](../../../src/features/market/pages/MarketComparisonPage.tsx) |
| ROUTE-8ea73544aa78 | U02 | `markets/correlations` | MarketCorrelationPairsPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketCorrelationPairsPage.tsx](../../../src/features/market/pages/MarketCorrelationPairsPage.tsx) |
| ROUTE-9e0da85ce2c2 | U02 | `markets/depth` | MarketDepthPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketDepthPage.tsx](../../../src/features/market/pages/MarketDepthPage.tsx) |
| ROUTE-f850b32533b0 | U02 | `markets/derivatives` | MarketDerivativesPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketDerivativesPage.tsx](../../../src/features/market/pages/MarketDerivativesPage.tsx) |
| ROUTE-e0009a24e70c | U02 | `markets/heatmap` | MarketHeatmapPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketHeatmapPage.tsx](../../../src/features/market/pages/MarketHeatmapPage.tsx) |
| ROUTE-9e75a4938378 | U02 | `markets/movers` | MarketMoversPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketMoversPage.tsx](../../../src/features/market/pages/MarketMoversPage.tsx) |
| ROUTE-bd1e7661d2fb | U02 | `markets/news` | MarketNewsFeedPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketNewsFeedPage.tsx](../../../src/features/market/pages/MarketNewsFeedPage.tsx) |
| ROUTE-8c4f95308fee | U02 | `markets/overview` | MarketOverviewPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketOverviewPage.tsx](../../../src/features/market/pages/MarketOverviewPage.tsx) |
| ROUTE-4d4c92233187 | U04 | `markets/portfolio-tracker` | PortfolioAnalyticsPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/PortfolioAnalyticsContractPage.tsx](../../../src/features/wallet/pages/PortfolioAnalyticsContractPage.tsx) |
| ROUTE-8385ec0b35bb | A07 | `markets/predictions/advanced-chart/:pairId` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-94c409346503 | A07 | `markets/predictions/data-integration` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-eceb7841f32f | A07 | `markets/predictions/event-calendar` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-7bb5a5336927 | A07 | `markets/predictions/market-maker` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-85b98b1c9273 | A07 | `markets/predictions/portfolio-analyzer` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-f1a422e83ec7 | U13 | `markets/predictions/risk-calculator` | PredictionRiskCalculatorPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/predictions/pages/PredictionRiskCalculatorPage.tsx](../../../src/features/predictions/pages/PredictionRiskCalculatorPage.tsx) |
| ROUTE-1d8062ccabb9 | A07 | `markets/predictions/social` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-20f8901965cc | A07 | `markets/predictions/tournaments` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-6be4d2d0d6af | U02 | `markets/screener` | MarketScreenerPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketScreenerPage.tsx](../../../src/features/market/pages/MarketScreenerPage.tsx) |
| ROUTE-8386c4beaa45 | U02 | `markets/sectors` | MarketSectorsPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketSectorsPage.tsx](../../../src/features/market/pages/MarketSectorsPage.tsx) |
| ROUTE-89ae37d850fa | U02 | `markets/signals` | MarketSignalsPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketSignalsPage.tsx](../../../src/features/market/pages/MarketSignalsPage.tsx) |
| ROUTE-001e85992969 | U02 | `markets/social-sentiment` | MarketSentimentPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketSentimentPage.tsx](../../../src/features/market/pages/MarketSentimentPage.tsx) |
| ROUTE-c0ca496696ab | U02 | `markets/unlocks` | TokenUnlockSchedulePage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/TokenUnlockSchedulePage.tsx](../../../src/features/market/pages/TokenUnlockSchedulePage.tsx) |
| ROUTE-5db173f95628 | U02 | `markets/watchlist` | WatchlistPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/WatchlistPage.tsx](../../../src/features/market/pages/WatchlistPage.tsx) |
| ROUTE-0e5547f62166 | U09 | `news` | WebNewsPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/support/pages/NewsContractPage.tsx](../../../src/features/support/pages/NewsContractPage.tsx) |
| ROUTE-00809916d5b1 | U09 | `news` | NewsPage | [src/features/support/routes.ts](../../../src/features/support/routes.ts) | [src/features/support/pages/NewsContractPage.tsx](../../../src/features/support/pages/NewsContractPage.tsx) |
| ROUTE-275c28ab474c | U09 | `notifications` | WebNotificationsPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/support/pages/NotificationsContractPage.tsx](../../../src/features/support/pages/NotificationsContractPage.tsx) |
| ROUTE-7cc1259bcf1e | U09 | `notifications` | NotificationsPage | [src/features/support/routes.ts](../../../src/features/support/routes.ts) | [src/features/support/pages/NotificationsContractPage.tsx](../../../src/features/support/pages/NotificationsContractPage.tsx) |
| ROUTE-3729636080ad | A07 | `onboarding` | OnboardingFlow | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-accb255cdbbe | U01 | `otp` | OTPPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/auth/pages/OTPPage.tsx](../../../src/features/auth/pages/OTPPage.tsx) |
| ROUTE-2e3b51e0645b | U01 | `otp` | WebOTPPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/auth/pages/WebOTPPage.tsx](../../../src/features/auth/pages/WebOTPPage.tsx) |
| ROUTE-6e27f1f95b79 | U05 | `p2p` | homePage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | [src/app/pages/p2p/P2PHomePage.tsx](../../../src/app/pages/p2p/P2PHomePage.tsx) |
| ROUTE-cef55c843694 | U05 | `p2p/achievements` | P2PAchievementsPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PAchievementsPage.tsx](../../../src/features/p2p/pages/P2PAchievementsPage.tsx) |
| ROUTE-7b49e9b89823 | U05 | `p2p/ad-analytics/:id` | P2PAdAnalyticsPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PAdAnalyticsPage.tsx](../../../src/features/p2p/pages/P2PAdAnalyticsPage.tsx) |
| ROUTE-49b2fb45446a | U05 | `p2p/ad/:id` | P2PAdDetailContractPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PAdDetailContractPage.tsx](../../../src/features/p2p/pages/P2PAdDetailContractPage.tsx) |
| ROUTE-2db84f5f9399 | U05 | `p2p/blacklist` | P2PBlacklistPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PBlacklistPage.tsx](../../../src/features/p2p/pages/P2PBlacklistPage.tsx) |
| ROUTE-87f134500022 | U05 | `p2p/blacklist/add` | P2PBlacklistAddPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PBlacklistAddPage.tsx](../../../src/features/p2p/pages/P2PBlacklistAddPage.tsx) |
| ROUTE-458ee36215fe | U05 | `p2p/chat/:orderId` | P2PChatPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PChatPage.tsx](../../../src/features/p2p/pages/P2PChatPage.tsx) |
| ROUTE-89753dc30827 | A07 | `p2p/compliance/aml-screening` | IntegrationPendingPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-b8aefd5f1144 | A07 | `p2p/compliance/large-transaction` | IntegrationPendingPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-c9829cfe7421 | A07 | `p2p/compliance/overview` | P2PComplianceOverviewPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-51f1e89f2d1c | A07 | `p2p/compliance/risk-assessment` | P2PRiskAssessmentPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-53354f5faf96 | A07 | `p2p/compliance/source-of-funds` | IntegrationPendingPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-82489c89a03c | U05 | `p2p/create` | P2PCreateAdContractPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PCreateAdContractPage.tsx](../../../src/features/p2p/pages/P2PCreateAdContractPage.tsx) |
| ROUTE-84f6fcf58a1e | U05 | `p2p/create-offer` | P2PCreateAdContractPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PCreateAdContractPage.tsx](../../../src/features/p2p/pages/P2PCreateAdContractPage.tsx) |
| ROUTE-ab26e28fe000 | U05 | `p2p/dashboard` | P2PDashboardPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PDashboardPage.tsx](../../../src/features/p2p/pages/P2PDashboardPage.tsx) |
| ROUTE-7a50e0d442b6 | A07 | `p2p/dispute/:orderId` | P2PDisputePage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-26df6d41982b | U05 | `p2p/dispute/detail/:id` | P2PDisputeDetailPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PDisputeDetailPage.tsx](../../../src/features/p2p/pages/P2PDisputeDetailPage.tsx) |
| ROUTE-9ed03416e92b | A07 | `p2p/dispute/evidence/:id` | P2PDisputeEvidencePage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-7b59cc2eb2e2 | A07 | `p2p/dispute/resolution/:id` | P2PDisputeResolutionPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-32ff39626474 | U05 | `p2p/disputes` | P2PDisputesPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PDisputesPage.tsx](../../../src/features/p2p/pages/P2PDisputesPage.tsx) |
| ROUTE-f353e234c0f8 | A07 | `p2p/e2e-info` | P2PE2EInfoPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-c7b338fe8ed1 | U05 | `p2p/escrow/:orderId` | P2PEscrowDetailPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PEscrowDetailPage.tsx](../../../src/features/p2p/pages/P2PEscrowDetailPage.tsx) |
| ROUTE-93f044f1bb63 | A07 | `p2p/escrow/balance` | P2PEscrowBalancePage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-5e52b5eedda4 | U05 | `p2p/express` | P2PExpressPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PExpressPage.tsx](../../../src/features/p2p/pages/P2PExpressPage.tsx) |
| ROUTE-304eeb6a9d89 | U05 | `p2p/express/confirm` | P2PExpressConfirmPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PExpressConfirmPage.tsx](../../../src/features/p2p/pages/P2PExpressConfirmPage.tsx) |
| ROUTE-5c2ca80ba668 | U05 | `p2p/fraud-prevention` | P2PFraudPreventionPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PFraudPreventionPage.tsx](../../../src/features/p2p/pages/P2PFraudPreventionPage.tsx) |
| ROUTE-3d4f710ef5ad | U05 | `p2p/guide` | P2PGuidePage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PGuidePage.tsx](../../../src/features/p2p/pages/P2PGuidePage.tsx) |
| ROUTE-d590a6b78ff0 | U05 | `p2p/insurance` | P2PInsuranceFundPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | [src/features/p2p/pages/P2PFrontendStatusPages.tsx](../../../src/features/p2p/pages/P2PFrontendStatusPages.tsx) · dev-only |
| ROUTE-721795dd1cd9 | U05 | `p2p/insurance-fund` | P2PInsuranceFundPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | [src/features/p2p/pages/P2PFrontendStatusPages.tsx](../../../src/features/p2p/pages/P2PFrontendStatusPages.tsx) · dev-only |
| ROUTE-efd5de01389b | A07 | `p2p/insurance/certificate` | P2PInsuranceCertificatePage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-b555a1b85fe8 | A07 | `p2p/insurance/claim/:id` | P2PClaimDetailPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-443e83d395f7 | U05 | `p2p/insurance/contribution-history` | P2PContributionHistoryPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | [src/features/p2p/pages/P2PFrontendStatusPages.tsx](../../../src/features/p2p/pages/P2PFrontendStatusPages.tsx) · dev-only |
| ROUTE-aaac40425d72 | A07 | `p2p/insurance/policy` | P2PInsurancePolicyPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-1dd1ab8a5fff | A07 | `p2p/insurance/score` | P2PInsuranceScorePage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-0bb7b9ec14f4 | A07 | `p2p/kyc/address` | IntegrationPendingPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-de4a7ca52bf3 | A07 | `p2p/kyc/identity` | IntegrationPendingPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-de5874dd41d5 | U05 | `p2p/kyc/requirements` | P2PKYCRequirementsPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | [src/features/p2p/pages/P2PFrontendStatusPages.tsx](../../../src/features/p2p/pages/P2PFrontendStatusPages.tsx) · dev-only |
| ROUTE-f60521748f7c | A07 | `p2p/kyc/selfie` | IntegrationPendingPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-24eb5a983540 | U05 | `p2p/kyc/status` | P2PKYCStatusPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | [src/features/p2p/pages/P2PFrontendStatusPages.tsx](../../../src/features/p2p/pages/P2PFrontendStatusPages.tsx) · dev-only |
| ROUTE-9186a314f9a5 | A07 | `p2p/kyc/video` | IntegrationPendingPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-93c414c6f3a4 | U05 | `p2p/limits` | P2PTransactionLimitsPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | [src/features/p2p/pages/P2PFrontendStatusPages.tsx](../../../src/features/p2p/pages/P2PFrontendStatusPages.tsx) · dev-only |
| ROUTE-2530104d2256 | A07 | `p2p/limits/tracker` | P2PLimitTrackerPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-045170d20ede | A07 | `p2p/merchant-apply` | P2PMerchantApplyPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-1eca4a659ada | U05 | `p2p/merchant/:merchantId` | P2PMerchantProfilePage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PMerchantProfilePage.tsx](../../../src/features/p2p/pages/P2PMerchantProfilePage.tsx) |
| ROUTE-13a966571e0b | U05 | `p2p/my-ads` | P2PMyAdsContractPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PMyAdsContractPage.tsx](../../../src/features/p2p/pages/P2PMyAdsContractPage.tsx) |
| ROUTE-9fae00378cab | U05 | `p2p/my-orders` | P2PMyOrdersPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | [src/features/p2p/pages/P2POrdersContractPage.tsx](../../../src/features/p2p/pages/P2POrdersContractPage.tsx) |
| ROUTE-0e4f67b83afd | A07 | `p2p/order-book` | P2POrderBookPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-a459045882d2 | U05 | `p2p/order-room` | P2PWebOrdersPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2POrdersContractPage.tsx](../../../src/features/p2p/pages/P2POrdersContractPage.tsx) |
| ROUTE-4046874c3b80 | U05 | `p2p/order/:orderId` | P2PEscrowDetailPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PEscrowDetailPage.tsx](../../../src/features/p2p/pages/P2PEscrowDetailPage.tsx) |
| ROUTE-ab8286a2822c | U05 | `p2p/order/cancel/:orderId` | P2POrderCancelPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2POrderActionPages.tsx](../../../src/features/p2p/pages/P2POrderActionPages.tsx) |
| ROUTE-53c8c7cb3f6a | U05 | `p2p/order/proof/:orderId` | P2POrderProofPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2POrderActionPages.tsx](../../../src/features/p2p/pages/P2POrderActionPages.tsx) |
| ROUTE-3292b628426d | U05 | `p2p/order/rate/:orderId` | P2POrderRatePage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2POrderActionPages.tsx](../../../src/features/p2p/pages/P2POrderActionPages.tsx) |
| ROUTE-b58d7661ea45 | U05 | `p2p/order/timeline/:orderId` | P2POrderTimelinePage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2POrderActionPages.tsx](../../../src/features/p2p/pages/P2POrderActionPages.tsx) |
| ROUTE-4982828ec6e1 | U05 | `p2p/payment-method/add` | P2PPaymentMethodAddPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PPaymentMethodAddPage.tsx](../../../src/features/p2p/pages/P2PPaymentMethodAddPage.tsx) |
| ROUTE-5f4ac7b29109 | A07 | `p2p/payment-method/cooling-period` | P2PPaymentMethodCoolingPeriodPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-81ac800131a9 | A07 | `p2p/payment-method/history` | P2PPaymentMethodHistoryPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-9b96028415c3 | A07 | `p2p/payment-method/ownership/:id` | P2PPaymentMethodOwnershipPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-c386cb668fda | A07 | `p2p/payment-method/verification/:id` | P2PPaymentMethodVerificationPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-98bf4e703ad9 | U05 | `p2p/payment-methods` | P2PPaymentMethodsPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PPaymentMethodsPage.tsx](../../../src/features/p2p/pages/P2PPaymentMethodsPage.tsx) |
| ROUTE-321d493e6df3 | U05 | `p2p/report/:merchantId` | P2PReportMerchantPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PReportMerchantPage.tsx](../../../src/features/p2p/pages/P2PReportMerchantPage.tsx) |
| ROUTE-427ae1ca0208 | U05 | `p2p/reviews` | P2PReviewsPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PReviewsPage.tsx](../../../src/features/p2p/pages/P2PReviewsPage.tsx) |
| ROUTE-14d51af52d90 | U05 | `p2p/security/2fa` | P2P2FASettingsPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2P2FASettingsPage.tsx](../../../src/features/p2p/pages/P2P2FASettingsPage.tsx) |
| ROUTE-ed691eac6174 | A07 | `p2p/security/anti-phishing` | IntegrationPendingPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-025d4f4c9713 | U05 | `p2p/security/center` | P2PSecurityCenterPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | [src/features/p2p/pages/P2PFrontendStatusPages.tsx](../../../src/features/p2p/pages/P2PFrontendStatusPages.tsx) · dev-only |
| ROUTE-fe8eee3ee902 | A07 | `p2p/security/devices` | IntegrationPendingPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-28967212985a | A07 | `p2p/security/login-history` | IntegrationPendingPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-faeea158fccc | A07 | `p2p/security/suspicious-activity` | IntegrationPendingPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-277c4ff30bae | A07 | `p2p/settings` | P2PSettingsPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-4ffc775933f2 | A07 | `p2p/settings/notifications` | P2PNotificationsSettingsPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-588c2d719cd8 | A07 | `p2p/tax-reporting` | P2PTaxReportingPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-45e73fb3b900 | U05 | `p2p/trading-level` | P2PTradingLevelPage | [src/features/p2p/routes.ts](../../../src/features/p2p/routes.ts) | [src/features/p2p/pages/P2PTradingLevelPage.tsx](../../../src/features/p2p/pages/P2PTradingLevelPage.tsx) |
| ROUTE-db748432c2af | U05 | `p2p/wallet` | P2PWalletPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | [src/features/p2p/pages/P2PFrontendStatusPages.tsx](../../../src/features/p2p/pages/P2PFrontendStatusPages.tsx) · dev-only |
| ROUTE-1fde2a85e0f0 | A07 | `p2p/wallet/fund-lock-history` | P2PFundLockHistoryPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-4e5d604e85f7 | A07 | `p2p/wallet/history` | P2PFundLockHistoryPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-80a0bff80011 | A07 | `p2p/wallet/transfer` | P2PWalletTransferPage | [src/app/routes/p2pProtectedRoutes.ts](../../../src/app/routes/p2pProtectedRoutes.ts) | Chưa resolve |
| ROUTE-b7bad741a9d0 | U02 | `pair/:pairId` | pairDetail / pairDetail | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/PairDetailPage.tsx](../../../src/features/market/pages/PairDetailPage.tsx) |
| ROUTE-989fb01ee3ca | U02 | `pair/:pairId/depth` | MarketDepthPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketDepthPage.tsx](../../../src/features/market/pages/MarketDepthPage.tsx) |
| ROUTE-4934b2f164f3 | U02 | `pair/:pairId/info` | TokenInfoPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/TokenInfoPage.tsx](../../../src/features/market/pages/TokenInfoPage.tsx) |
| ROUTE-271f8c1c2647 | U13 | `portfolio` | PredictionsPortfolioPage / portfolio | [src/features/predictions/routes.ts](../../../src/features/predictions/routes.ts) | [src/features/predictions/pages/PredictionContractPages.tsx](../../../src/features/predictions/pages/PredictionContractPages.tsx) |
| ROUTE-6a48f3a3298b | U04 | `portfolio/analytics` | PortfolioAnalyticsPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/PortfolioAnalyticsContractPage.tsx](../../../src/features/wallet/pages/PortfolioAnalyticsContractPage.tsx) |
| ROUTE-b7903bd4579f | U13 | `predictions` | WebPredictionsPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/predictions/pages/PredictionContractPages.tsx](../../../src/features/predictions/pages/PredictionContractPages.tsx) |
| ROUTE-608fc3c97063 | U13 | `predictions/event/:eventId` | WebPredictionEventDetailPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/predictions/pages/PredictionContractPages.tsx](../../../src/features/predictions/pages/PredictionContractPages.tsx) |
| ROUTE-c307aac4b5f2 | U08 | `profile` | ProfilePage / ProfilePage | [src/app/routes/walletProfileProtectedRoutes.ts](../../../src/app/routes/walletProfileProtectedRoutes.ts) | [src/features/profile/pages/ProfileContractPage.tsx](../../../src/features/profile/pages/ProfileContractPage.tsx) |
| ROUTE-7738fdc2eb96 | U08 | `profile/activity` | WebActivityHistoryPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/profile/pages/ActivityLogContractPage.tsx](../../../src/features/profile/pages/ActivityLogContractPage.tsx) |
| ROUTE-c7a9fcae9d50 | U08 | `profile/activity` | ActivityLogPage | [src/features/profile/routes.ts](../../../src/features/profile/routes.ts) | [src/features/profile/pages/ActivityLogContractPage.tsx](../../../src/features/profile/pages/ActivityLogContractPage.tsx) |
| ROUTE-e826987e5492 | A07 | `profile/api` | IntegrationPendingPage | [src/app/routes/walletProfileProtectedRoutes.ts](../../../src/app/routes/walletProfileProtectedRoutes.ts) | Chưa resolve |
| ROUTE-692fbd09eb39 | A07 | `profile/api/create` | IntegrationPendingPage | [src/app/routes/walletProfileProtectedRoutes.ts](../../../src/app/routes/walletProfileProtectedRoutes.ts) | Chưa resolve |
| ROUTE-876520e63105 | A07 | `profile/arena` | MyArenaPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-3bb47ac55908 | U08 | `profile/devices` | WebDeviceManagementPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/profile/pages/DeviceManagementContractPage.tsx](../../../src/features/profile/pages/DeviceManagementContractPage.tsx) |
| ROUTE-0a87975517d8 | U08 | `profile/devices` | DeviceManagementPage | [src/features/profile/routes.ts](../../../src/features/profile/routes.ts) | [src/features/profile/pages/DeviceManagementContractPage.tsx](../../../src/features/profile/pages/DeviceManagementContractPage.tsx) |
| ROUTE-e17fdbc6f701 | U08 | `profile/edit` | WebEditProfilePage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/profile/pages/EditProfileContractPage.tsx](../../../src/features/profile/pages/EditProfileContractPage.tsx) |
| ROUTE-14cc20e54808 | U08 | `profile/edit` | EditProfilePage | [src/features/profile/routes.ts](../../../src/features/profile/routes.ts) | [src/features/profile/pages/EditProfileContractPage.tsx](../../../src/features/profile/pages/EditProfileContractPage.tsx) |
| ROUTE-45d2f0c99e4d | A07 | `profile/kyc` | IntegrationPendingPage | [src/app/routes/walletProfileProtectedRoutes.ts](../../../src/app/routes/walletProfileProtectedRoutes.ts) | Chưa resolve |
| ROUTE-30268306e592 | U13 | `profile/predictions` | PredictionsPortfolioPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/predictions/pages/PredictionContractPages.tsx](../../../src/features/predictions/pages/PredictionContractPages.tsx) |
| ROUTE-8fa2993c465b | U08 | `profile/security` | SecurityPage | [src/features/profile/routes.ts](../../../src/features/profile/routes.ts) | [src/features/profile/pages/SecurityContractPage.tsx](../../../src/features/profile/pages/SecurityContractPage.tsx) |
| ROUTE-0a6d17d5eb71 | A07 | `profile/security/alert-detail` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-ca42a06fe8cb | A07 | `profile/security/alert-list` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-e5cb2358a296 | A07 | `profile/security/alerts/:alertId` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-6df78be03c13 | A07 | `profile/security/anti-phishing` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-f976b2619f33 | U01 | `profile/security/change-password` | PasswordChangePage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/auth/pages/PasswordChangePage.tsx](../../../src/features/auth/pages/PasswordChangePage.tsx) |
| ROUTE-45ee06f8269e | A07 | `profile/security/device-trust` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-d22217c369e7 | A07 | `profile/security/devices/:deviceId` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-33dab2441308 | A07 | `profile/security/login-activity` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-985d0fe33a66 | A07 | `profile/security/notifications` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-2a1095bf25de | A07 | `profile/security/passkey` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-7038d33989c7 | A07 | `profile/security/security-audit` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-61bdce3748e6 | A07 | `profile/security/session-management` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-0c9735fe19cd | A07 | `profile/security/two-factor-auth` | IntegrationPendingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-0fa5c5641c7a | U04 | `profile/security/withdrawal-whitelist` | WithdrawalWhitelistPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/WebWithdrawalWhitelistPage.tsx](../../../src/features/wallet/pages/WebWithdrawalWhitelistPage.tsx) |
| ROUTE-062c7d0635bc | A07 | `profile/settings` | IntegrationPendingPage | [src/app/routes/walletProfileProtectedRoutes.ts](../../../src/app/routes/walletProfileProtectedRoutes.ts) | Chưa resolve |
| ROUTE-91d3e8083aca | U08 | `profile/sub-accounts` | WebSubAccountPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/profile/pages/SubAccountContractPage.tsx](../../../src/features/profile/pages/SubAccountContractPage.tsx) |
| ROUTE-24fe93c8c5fe | U08 | `profile/sub-accounts` | SubAccountPage | [src/features/profile/routes.ts](../../../src/features/profile/routes.ts) | [src/features/profile/pages/SubAccountContractPage.tsx](../../../src/features/profile/pages/SubAccountContractPage.tsx) |
| ROUTE-0f9eb99c9ffd | A07 | `profile/vip` | IntegrationPendingPage | [src/app/routes/walletProfileProtectedRoutes.ts](../../../src/app/routes/walletProfileProtectedRoutes.ts) | Chưa resolve |
| ROUTE-ec89773bdcf5 | A07 | `r` | ResponsiveAppLayout | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-353c520ab36c | A07 | `r` | ShellTemplatePage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/dev/legacy/responsive/ShellTemplatePage.tsx](../../../src/dev/legacy/responsive/ShellTemplatePage.tsx) · dev-only |
| ROUTE-48ab6ac9f36e | A07 | `r/shell` | ShellTemplatePage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/dev/legacy/responsive/ShellTemplatePage.tsx](../../../src/dev/legacy/responsive/ShellTemplatePage.tsx) · dev-only |
| ROUTE-21cbe2587267 | U13 | `receipt/:orderId` | PredictionOrderReceiptPage / receipt | [src/features/predictions/routes.ts](../../../src/features/predictions/routes.ts) | [src/features/predictions/pages/PredictionContractPages.tsx](../../../src/features/predictions/pages/PredictionContractPages.tsx) |
| ROUTE-bf5bdb8c04c4 | U14 | `referral` | ReferralHomePage / home | [src/features/referral/routes.ts](../../../src/features/referral/routes.ts) | [src/features/referral/pages/ReferralContractPage.tsx](../../../src/features/referral/pages/ReferralContractPage.tsx) |
| ROUTE-abb240403718 | A07 | `referral/friend/:friendId` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-99a7ded9565e | A07 | `referral/history` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-106bbd2431e7 | A07 | `referral/rewards` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-9c0d0da20838 | A07 | `referral/rules` | IntegrationPendingPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-818c037b98a5 | U01 | `register` | RegisterPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/auth/pages/RegisterPage.tsx](../../../src/features/auth/pages/RegisterPage.tsx) · dev-only |
| ROUTE-d553aec3dd63 | U01 | `register` | WebRegisterPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/auth/pages/WebRegisterPage.tsx](../../../src/features/auth/pages/WebRegisterPage.tsx) · dev-only |
| ROUTE-13bb9a025244 | U01 | `reset-password` | ResetPasswordPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | [src/features/auth/pages/PasswordResetPages.tsx](../../../src/features/auth/pages/PasswordResetPages.tsx) |
| ROUTE-90d53d0b54e7 | U01 | `reset-password` | WebResetPasswordPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/auth/pages/PasswordResetPages.tsx](../../../src/features/auth/pages/PasswordResetPages.tsx) |
| ROUTE-45a3b1430089 | A07 | `rewards` | RewardsHubPage | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-5eda51b4442b | U13 | `rewards` | PredictionsRewardsPage / rewards | [src/features/predictions/routes.ts](../../../src/features/predictions/routes.ts) | [src/features/predictions/pages/PredictionContractPages.tsx](../../../src/features/predictions/pages/PredictionContractPages.tsx) |
| ROUTE-5eb06844154f | U02 | `scanner` | MarketScreenerPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/MarketScreenerPage.tsx](../../../src/features/market/pages/MarketScreenerPage.tsx) |
| ROUTE-6fd82879c95d | U10 | `search` | SearchPage | [src/features/discovery/routes.ts](../../../src/features/discovery/routes.ts) | [src/features/discovery/pages/DiscoveryContractPages.tsx](../../../src/features/discovery/pages/DiscoveryContractPages.tsx) |
| ROUTE-b2ff379a3600 | U13 | `search` | PredictionsSearchPage / search | [src/features/predictions/routes.ts](../../../src/features/predictions/routes.ts) | [src/features/predictions/pages/PredictionContractPages.tsx](../../../src/features/predictions/pages/PredictionContractPages.tsx) |
| ROUTE-e705fc2b6db3 | U01 | `session-expired` | WebSessionExpiredPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/auth/pages/WebSessionExpiredPage.tsx](../../../src/features/auth/pages/WebSessionExpiredPage.tsx) |
| ROUTE-ca7fd80f0194 | A07 | `smart-alerts` | SmartAlertCenter | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-2b57d7e87016 | U01 | `success` | WebAuthSuccessPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/auth/pages/WebAuthSuccessPage.tsx](../../../src/features/auth/pages/WebAuthSuccessPage.tsx) |
| ROUTE-d7a9b1c24261 | U09 | `support` | WebSupportPage | [src/app/routes.ts](../../../src/app/routes.ts) | [src/features/support/pages/SupportContractPage.tsx](../../../src/features/support/pages/SupportContractPage.tsx) |
| ROUTE-c45fa2bf8a35 | U09 | `support` | SupportPage | [src/features/support/routes.ts](../../../src/features/support/routes.ts) | [src/features/support/pages/SupportContractPage.tsx](../../../src/features/support/pages/SupportContractPage.tsx) |
| ROUTE-e0efaf51cbb1 | U09 | `support/announcements` | AnnouncementsPage | [src/features/support/routes.ts](../../../src/features/support/routes.ts) | [src/features/support/pages/NewsContractPage.tsx](../../../src/features/support/pages/NewsContractPage.tsx) |
| ROUTE-926107b03939 | U09 | `support/help` | HelpCenterPage | [src/features/support/routes.ts](../../../src/features/support/routes.ts) | [src/features/support/pages/HelpCenterContractPage.tsx](../../../src/features/support/pages/HelpCenterContractPage.tsx) |
| ROUTE-5affb00e2bda | A07 | `t` | TabletShell | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-841c192468f7 | A07 | `tax-reports` | TaxReportCenter | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-76e4b482c8c9 | U10 | `topic/:topicId` | TopicPage | [src/features/discovery/routes.ts](../../../src/features/discovery/routes.ts) | [src/features/discovery/pages/DiscoveryContractPages.tsx](../../../src/features/discovery/pages/DiscoveryContractPages.tsx) |
| ROUTE-266863b7900f | U10 | `topics` | TopicPage | [src/features/discovery/routes.ts](../../../src/features/discovery/routes.ts) | [src/features/discovery/pages/DiscoveryContractPages.tsx](../../../src/features/discovery/pages/DiscoveryContractPages.tsx) |
| ROUTE-a362a35b4986 | U03 | `trade` | tradePage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | [src/features/trading/pages/TradePage.tsx](../../../src/features/trading/pages/TradePage.tsx) |
| ROUTE-a567867a4caf | U03 | `trade/:pairId` | tradePage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | [src/features/trading/pages/TradePage.tsx](../../../src/features/trading/pages/TradePage.tsx) |
| ROUTE-9499b2a7d00d | A07 | `trade/:pairId/futures` | FuturesPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-47818001e8dd | A07 | `trade/:pairId/futures/leverage` | LeveragePage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-2fef4b585577 | U02 | `trade/advanced-chart/:pairId` | AdvancedChartsPage | [src/features/market/routes.ts](../../../src/features/market/routes.ts) | [src/features/market/pages/AdvancedChartsPage.tsx](../../../src/features/market/pages/AdvancedChartsPage.tsx) |
| ROUTE-ef18cbba0c6f | A07 | `trade/advanced-tools` | AdvancedToolsDemoPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-083bac5e7f8f | U03 | `trade/analytics` | TradingWebAnalyticsPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/TradeAnalyticsContractPage.tsx](../../../src/features/trading/pages/TradeAnalyticsContractPage.tsx) |
| ROUTE-b1761e19c89d | A07 | `trade/bots` | WebTradingBotsPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-2c0f919417bf | A07 | `trade/bots` | TradingBotsPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-3ae0c9d3ce5a | A07 | `trade/bots/api-documentation` | WebBotAPIDocumentationPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-f6071b443de2 | A07 | `trade/bots/api-documentation` | BotAPIDocumentationPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-aab690e09de4 | A07 | `trade/bots/backtesting` | WebBotBacktestingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-f40c753a6d0f | A07 | `trade/bots/backtesting` | BotBacktestingPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-d1ffae5c33bb | A07 | `trade/bots/drawdown-analyzer` | WebBotDrawdownAnalyzerPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-e51737744fec | A07 | `trade/bots/drawdown-analyzer` | BotDrawdownAnalyzerPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-448576b12036 | A07 | `trade/bots/emergency-stop` | WebBotEmergencyStopPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-320eb0654997 | A07 | `trade/bots/emergency-stop` | BotEmergencyStopPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-8a0d26a608ff | A07 | `trade/bots/equity-curve` | WebBotEquityCurvePage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-23b12603686a | A07 | `trade/bots/equity-curve` | BotEquityCurvePage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-d95fdda4bea2 | A07 | `trade/bots/faq` | WebBotFAQPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-19010c3de882 | A07 | `trade/bots/faq` | BotFAQPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-bf576b0cd938 | A07 | `trade/bots/guide` | WebBotGuidePage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-eed7e81c7164 | A07 | `trade/bots/guide` | BotGuidePage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-07fdb3d3506d | A07 | `trade/bots/history` | WebBotHistoryPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-c828ab9d794a | A07 | `trade/bots/history` | BotHistoryPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-1ab379aa6d57 | A07 | `trade/bots/optimization` | WebBotOptimizationPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-5273e47f832f | A07 | `trade/bots/optimization` | BotOptimizationPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-5708d1b0bbc2 | A07 | `trade/bots/performance-analytics` | WebBotPerformanceAnalyticsPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-b1548a45e779 | A07 | `trade/bots/performance-analytics` | BotPerformanceAnalyticsPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-fa36f7fc4f7a | A07 | `trade/bots/portfolio-dashboard` | WebBotPortfolioDashboardPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-708e8beddf28 | A07 | `trade/bots/portfolio-dashboard` | BotPortfolioDashboardPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-014a92d6e43b | A07 | `trade/bots/risk-dashboard` | WebBotRiskDashboardPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-cb15db59bceb | A07 | `trade/bots/risk-dashboard` | BotRiskDashboardPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-886d71026ed0 | A07 | `trade/bots/risk-disclosure` | WebBotRiskDisclosurePage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-9d6cb20f1bc1 | A07 | `trade/bots/risk-disclosure` | BotRiskDisclosurePage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-b1b33fad826b | A07 | `trade/bots/security-settings` | WebBotSecuritySettingsPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-91bdbec49256 | A07 | `trade/bots/security-settings` | BotSecuritySettingsPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-a8136802fc48 | A07 | `trade/bots/strategy-compare` | WebBotStrategyComparePage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-aa8dbc8c571c | A07 | `trade/bots/strategy-compare` | BotStrategyComparePage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-cd859840ab3a | A07 | `trade/bots/suitability-assessment` | WebBotSuitabilityAssessmentPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-fcd2078247f6 | A07 | `trade/bots/suitability-assessment` | BotSuitabilityAssessmentPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-bcaccb1ecc21 | A07 | `trade/bots/tax-reporting` | WebBotTaxReportingPage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-bec838b3a4d1 | A07 | `trade/bots/tax-reporting` | BotTaxReportingPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-b847fa058c5c | A07 | `trade/bots/terms-of-service` | WebBotTermsOfServicePage | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-264852dbc022 | A07 | `trade/bots/terms-of-service` | BotTermsOfServicePage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-a27fb3bb0e38 | A07 | `trade/convert` | ConvertPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-607b259f33b9 | U03 | `trade/copy` | CopyTradingPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/CopyTradingPage.tsx](../../../src/features/trading/pages/CopyTradingPage.tsx) |
| ROUTE-39bc5733b231 | A07 | `trade/copy-audit-log/:copyId` | IntegrationPendingPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-48e77cea71b8 | A07 | `trade/copy-dispute-resolution` | IntegrationPendingPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-f7bd9841d24f | U03 | `trade/copy-performance/:copyId` | TradingWebCopyPerformancePage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/WebCopyPerformancePage.tsx](../../../src/features/trading/pages/WebCopyPerformancePage.tsx) |
| ROUTE-2a2dcf2d2211 | U03 | `trade/copy-performance/:copyId/attribution` | PerformanceAttributionPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | [src/features/trading/pages/CopyFrontendStatusPages.tsx](../../../src/features/trading/pages/CopyFrontendStatusPages.tsx) · dev-only |
| ROUTE-42b71b3e086a | U03 | `trade/copy-provider-apply` | ProviderApplicationPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | [src/features/trading/pages/CopyFrontendStatusPages.tsx](../../../src/features/trading/pages/CopyFrontendStatusPages.tsx) · dev-only |
| ROUTE-cc3d64fe9ad9 | U03 | `trade/copy-provider-governance` | ProviderGovernancePage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | [src/features/trading/pages/CopyFrontendStatusPages.tsx](../../../src/features/trading/pages/CopyFrontendStatusPages.tsx) · dev-only |
| ROUTE-1bf79bd9f7bc | U03 | `trade/copy-provider/:providerId` | CopyProviderDetailPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/CopyProviderDetailContractPage.tsx](../../../src/features/trading/pages/CopyProviderDetailContractPage.tsx) |
| ROUTE-7a7741a02122 | U03 | `trade/copy-provider/:providerId/assessment` | PreCopyAssessmentPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/PreCopyAssessmentContractPage.tsx](../../../src/features/trading/pages/PreCopyAssessmentContractPage.tsx) |
| ROUTE-a4a60045614b | U03 | `trade/copy-provider/:providerId/configuration` | CopyConfigurationPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/CopyConfigurationContractPage.tsx](../../../src/features/trading/pages/CopyConfigurationContractPage.tsx) |
| ROUTE-6922c1aa3782 | U03 | `trade/copy-provider/:providerId/confirmation` | CopyConfirmationPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/CopyConfirmationContractPage.tsx](../../../src/features/trading/pages/CopyConfirmationContractPage.tsx) |
| ROUTE-1bfd4af9e11b | A07 | `trade/copy-regulatory-disclosures` | IntegrationPendingPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-666a991b8e91 | U03 | `trade/copy-safety-center` | CopySafetyCenterPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | [src/features/trading/pages/CopyFrontendStatusPages.tsx](../../../src/features/trading/pages/CopyFrontendStatusPages.tsx) · dev-only |
| ROUTE-11360765dc45 | U03 | `trade/copy-trading` | CopyTradingPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/CopyTradingPage.tsx](../../../src/features/trading/pages/CopyTradingPage.tsx) |
| ROUTE-3c54c2d2b77f | U03 | `trade/copy-trading/active` | ActiveCopiesPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/ActiveCopiesContractPage.tsx](../../../src/features/trading/pages/ActiveCopiesContractPage.tsx) |
| ROUTE-8ea603cd87c1 | A07 | `trade/copy-trading/arm-integration-status` | ARMIntegrationStatusPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-4b17f8bf7004 | A07 | `trade/copy-trading/audit-trail` | AuditTrailPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-2cbfad2a1558 | A07 | `trade/copy-trading/best-execution-reports` | BestExecutionReportsPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-fc6b94795cec | A07 | `trade/copy-trading/cass-reconciliation` | CASSReconciliationPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-77494bdec595 | A07 | `trade/copy-trading/client-categorization` | ClientCategorizationPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-50ce7034d5f9 | A07 | `trade/copy-trading/client-money-protection` | ClientMoneyProtectionPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-684f3e8441cc | U03 | `trade/copy-trading/comparison` | ProviderComparisonPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/ProviderComparisonContractPage.tsx](../../../src/features/trading/pages/ProviderComparisonContractPage.tsx) |
| ROUTE-2bf2cad3ccb6 | A07 | `trade/copy-trading/complaint-submission` | ComplaintSubmissionPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-651ba97c5708 | A07 | `trade/copy-trading/complaint-tracking` | ComplaintTrackingPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-577b57dc4de7 | A07 | `trade/copy-trading/complaints-handling` | ComplaintsHandlingPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-62f9eba59629 | U03 | `trade/copy-trading/education` | CopyEducationPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/CopyEducationPage.tsx](../../../src/features/trading/pages/CopyEducationPage.tsx) |
| ROUTE-fd9e96582106 | A07 | `trade/copy-trading/ex-ante-costs` | ExAnteCostsPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-abaff84c491f | A07 | `trade/copy-trading/ex-post-costs-report` | ExPostCostsReportPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-7eeb89876e70 | A07 | `trade/copy-trading/execution-venue-analysis` | ExecutionVenueAnalysisPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-0e74071019bb | A07 | `trade/copy-trading/investor-compensation` | InvestorCompensationPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-4c92b7762fac | A07 | `trade/copy-trading/kid-generator` | KIDGeneratorPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-9f32b4033c38 | U03 | `trade/copy-trading/leaderboard` | ProviderLeaderboardPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/ProviderLeaderboardPage.tsx](../../../src/features/trading/pages/ProviderLeaderboardPage.tsx) |
| ROUTE-78bf9ecea03e | A07 | `trade/copy-trading/notifications` | CopyNotificationsPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-52363e3d2728 | A07 | `trade/copy-trading/ombudsman-referral` | OmbudsmanReferralPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-28eda893e1e6 | A07 | `trade/copy-trading/performance-scenarios` | PerformanceScenariosPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-857ffcf94465 | A07 | `trade/copy-trading/product-governance` | ProductGovernancePage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-97d93676b5b2 | A07 | `trade/copy-trading/regulatory-inspection-ready` | RegulatoryInspectionReadyPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-3ab0c5b31607 | A07 | `trade/copy-trading/regulatory-reports-dashboard` | RegulatoryReportsDashboardPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-1324aa60a404 | A07 | `trade/copy-trading/risk-analysis` | IntegrationPendingPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-08e7e48da2ff | A07 | `trade/copy-trading/risk-indicator-explainer` | RiskIndicatorExplainerPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-36cbba3b7905 | A07 | `trade/copy-trading/riy-calculator` | RIYCalculatorPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-be2c800acf49 | A07 | `trade/copy-trading/safety` | IntegrationPendingPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-13d4c5a4d439 | A07 | `trade/copy-trading/settings` | IntegrationPendingPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-e134f4dff13b | A07 | `trade/copy-trading/slippage-monitoring` | SlippageMonitoringPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-7a652a13352f | A07 | `trade/copy-trading/target-market-definition` | TargetMarketDefinitionPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-a10fd211ee03 | A07 | `trade/copy-trading/transaction-reporting` | TransactionReportingPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-bcfe87d7cc93 | U03 | `trade/copy-trading/v2` | CopyTradingPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/CopyTradingPage.tsx](../../../src/features/trading/pages/CopyTradingPage.tsx) |
| ROUTE-f0363014cbcc | U03 | `trade/copy/active` | ActiveCopiesPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/ActiveCopiesContractPage.tsx](../../../src/features/trading/pages/ActiveCopiesContractPage.tsx) |
| ROUTE-b83f4ded01af | U03 | `trade/copy/education` | CopyEducationPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/CopyEducationPage.tsx](../../../src/features/trading/pages/CopyEducationPage.tsx) |
| ROUTE-44c5a27ca12d | U03 | `trade/copy/performance/:copyId` | TradingWebCopyPerformancePage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/WebCopyPerformancePage.tsx](../../../src/features/trading/pages/WebCopyPerformancePage.tsx) |
| ROUTE-c0eabd00b15d | U03 | `trade/copy/provider/:providerId` | CopyProviderDetailPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/CopyProviderDetailContractPage.tsx](../../../src/features/trading/pages/CopyProviderDetailContractPage.tsx) |
| ROUTE-c862622def9f | U03 | `trade/copy/provider/:providerId/assessment` | PreCopyAssessmentPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/PreCopyAssessmentContractPage.tsx](../../../src/features/trading/pages/PreCopyAssessmentContractPage.tsx) |
| ROUTE-cbff0b379952 | U03 | `trade/copy/provider/:providerId/configuration` | CopyConfigurationPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/CopyConfigurationContractPage.tsx](../../../src/features/trading/pages/CopyConfigurationContractPage.tsx) |
| ROUTE-b0bfca1bf3a4 | U03 | `trade/copy/provider/:providerId/confirmation` | CopyConfirmationPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/CopyConfirmationContractPage.tsx](../../../src/features/trading/pages/CopyConfirmationContractPage.tsx) |
| ROUTE-de24413caa40 | A07 | `trade/execution-quality` | ExecutionQualityDemoPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-ab18defb9f49 | A07 | `trade/export` | TradeHistoryExportPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-43c46ce7f40a | A07 | `trade/margin` | MarginTradingPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-f871642cfa70 | A07 | `trade/margin/:pairId` | MarginTradingPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-a23b55798917 | A07 | `trade/margin/advanced-analytics` | AdvancedAnalyticsPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-f6df55df2235 | A07 | `trade/margin/advanced-demo` | AdvancedTradingDemoPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-8b693235094d | A07 | `trade/margin/hub` | MarginTradingHubPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-7a204cb50cff | A07 | `trade/margin/live-market-data-analytics` | LiveMarketDataAnalyticsPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-c5018d19dc26 | A07 | `trade/margin/market-data-analytics` | MarketDataAnalyticsPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-2596278efe48 | U03 | `trade/order-receipt` | OrderReceiptPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/OrderReceiptPage.tsx](../../../src/features/trading/pages/OrderReceiptPage.tsx) |
| ROUTE-12d48f368c4c | U03 | `trade/orders` | OrdersHistoryPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/OrdersHistoryPage.tsx](../../../src/features/trading/pages/OrdersHistoryPage.tsx) |
| ROUTE-47fef8f29753 | U03 | `trade/orders-history` | OrdersHistoryPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/OrdersHistoryPage.tsx](../../../src/features/trading/pages/OrdersHistoryPage.tsx) |
| ROUTE-fdde4613c477 | U03 | `trade/positions` | OpenPositionsPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/OpenPositionsPage.tsx](../../../src/features/trading/pages/OpenPositionsPage.tsx) |
| ROUTE-3de38f676af5 | A07 | `trade/risk-management` | RiskManagementDemoPage | [src/app/routes/tradingProtectedRoutes.ts](../../../src/app/routes/tradingProtectedRoutes.ts) | Chưa resolve |
| ROUTE-8581550387fe | U03 | `trade/settings` | TradeSettingsPage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/TradeSettingsPage.tsx](../../../src/features/trading/pages/TradeSettingsPage.tsx) |
| ROUTE-feb2ae9cd924 | U03 | `trade/trader/:traderId` | TraderProfilePage | [src/features/trading/routes.ts](../../../src/features/trading/routes.ts) | [src/features/trading/pages/TraderProfilePage.tsx](../../../src/features/trading/pages/TraderProfilePage.tsx) |
| ROUTE-d0b27b5bf134 | A07 | `unified-portfolio` | UnifiedPortfolioDashboard | [src/app/routeConfig.ts](../../../src/app/routeConfig.ts) | Chưa resolve |
| ROUTE-9180faf7fd1c | A07 | `w` | WebShell | [src/app/routes.ts](../../../src/app/routes.ts) | Chưa resolve |
| ROUTE-9b27a61ad22a | U04 | `wallet` | WalletPage / WalletPage | [src/app/routes/walletProfileProtectedRoutes.ts](../../../src/app/routes/walletProfileProtectedRoutes.ts) | [src/features/wallet/pages/WalletOverviewContractPage.tsx](../../../src/features/wallet/pages/WalletOverviewContractPage.tsx) |
| ROUTE-5590c2adf8cc | U04 | `wallet/address-book` | AddressBookPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/AddressBookPage.tsx](../../../src/features/wallet/pages/AddressBookPage.tsx) |
| ROUTE-177f8722c90b | U04 | `wallet/address-book/add` | AddressAddPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/AddressAddPage.tsx](../../../src/features/wallet/pages/AddressAddPage.tsx) |
| ROUTE-ca39c74ef725 | U04 | `wallet/asset/:assetId` | AssetDetailPage / assetDetail | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/app/pages/wallet/AssetDetailPage.tsx](../../../src/app/pages/wallet/AssetDetailPage.tsx) |
| ROUTE-e9b2b624774d | A07 | `wallet/buy-crypto` | IntegrationPendingPage | [src/app/routes/walletProfileProtectedRoutes.ts](../../../src/app/routes/walletProfileProtectedRoutes.ts) | Chưa resolve |
| ROUTE-d2abff04735c | U04 | `wallet/deposit` | WalletDepositPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/WalletDepositContractPage.tsx](../../../src/features/wallet/pages/WalletDepositContractPage.tsx) |
| ROUTE-7e2f686f7975 | U04 | `wallet/deposit/:asset` | WalletDepositPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/WalletDepositContractPage.tsx](../../../src/features/wallet/pages/WalletDepositContractPage.tsx) |
| ROUTE-cf9c8fe20fd4 | U04 | `wallet/dust-converter` | DustConverterPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/DustConverterPage.tsx](../../../src/features/wallet/pages/DustConverterPage.tsx) |
| ROUTE-66693fdcddc8 | A07 | `wallet/gas-optimizer` | IntegrationPendingPage | [src/app/routes/walletProfileProtectedRoutes.ts](../../../src/app/routes/walletProfileProtectedRoutes.ts) | Chưa resolve |
| ROUTE-3e7899c03852 | A07 | `wallet/health-score` | IntegrationPendingPage | [src/app/routes/walletProfileProtectedRoutes.ts](../../../src/app/routes/walletProfileProtectedRoutes.ts) | Chưa resolve |
| ROUTE-41fd7d2aac32 | U04 | `wallet/history` | TxHistoryPage / TxHistoryPage | [src/app/routes/walletProfileProtectedRoutes.ts](../../../src/app/routes/walletProfileProtectedRoutes.ts) | [src/features/wallet/pages/WalletTransactionHistoryContractPage.tsx](../../../src/features/wallet/pages/WalletTransactionHistoryContractPage.tsx) |
| ROUTE-5386bc30c1e9 | U04 | `wallet/limits` | WithdrawalLimitsPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/WithdrawalLimitsPage.tsx](../../../src/features/wallet/pages/WithdrawalLimitsPage.tsx) |
| ROUTE-aa43c1c15b0b | A07 | `wallet/multi-manager` | IntegrationPendingPage | [src/app/routes/walletProfileProtectedRoutes.ts](../../../src/app/routes/walletProfileProtectedRoutes.ts) | Chưa resolve |
| ROUTE-cf3653865a54 | U04 | `wallet/network-status` | NetworkStatusPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/NetworkStatusPage.tsx](../../../src/features/wallet/pages/NetworkStatusPage.tsx) |
| ROUTE-42c11721d91a | U04 | `wallet/pending-deposits` | PendingDepositsPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/PendingDepositsPage.tsx](../../../src/features/wallet/pages/PendingDepositsPage.tsx) |
| ROUTE-7f5c2889b12b | U04 | `wallet/portfolio-analytics` | PortfolioAnalyticsPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/PortfolioAnalyticsContractPage.tsx](../../../src/features/wallet/pages/PortfolioAnalyticsContractPage.tsx) |
| ROUTE-66c301c0630a | A07 | `wallet/token-approval` | IntegrationPendingPage | [src/app/routes/walletProfileProtectedRoutes.ts](../../../src/app/routes/walletProfileProtectedRoutes.ts) | Chưa resolve |
| ROUTE-45ff63073d6d | U04 | `wallet/transaction/:txId` | TransactionDetailPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/TransactionDetailPage.tsx](../../../src/features/wallet/pages/TransactionDetailPage.tsx) |
| ROUTE-9251a87e457f | U04 | `wallet/transfer` | WalletTransferPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/WalletTransferContractPage.tsx](../../../src/features/wallet/pages/WalletTransferContractPage.tsx) |
| ROUTE-6359ac5105b0 | U04 | `wallet/withdraw` | WithdrawPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/WithdrawPage.tsx](../../../src/features/wallet/pages/WithdrawPage.tsx) |
| ROUTE-7731e4a1b70c | U04 | `wallet/withdraw/:asset` | WithdrawPage | [src/features/wallet/routes.ts](../../../src/features/wallet/routes.ts) | [src/features/wallet/pages/WithdrawPage.tsx](../../../src/features/wallet/pages/WithdrawPage.tsx) |

## Toàn bộ API operation

Quyền “chưa khai báo” là trạng thái metadata, không phải kết luận server không kiểm tra quyền. Idempotency “không yêu cầu” là số liệu contract hiện tại; đọc policy auth/challenge trước khi yêu cầu bổ sung.

| ID | Task | Method/path | operationId | Contract | Permission metadata | Idempotency required |
| --- | --- | --- | --- | --- | --- | --- |
| API-8c2cbf4716c2 | U15 | `GET /admin/overview` | getAdminOverview | [contracts/openapi/admin.yaml](../../../contracts/openapi/admin.yaml) | ["admin:read"] | Không |
| API-aa6a2867f8a1 | U15 | `GET /admin/analytics/funnel` | getAdminFunnel | [contracts/openapi/admin.yaml](../../../contracts/openapi/admin.yaml) | ["admin:read"] | Không |
| API-612cca0fff1e | U15 | `GET /admin/analytics/ab-tests` | listAdminAbTests | [contracts/openapi/admin.yaml](../../../contracts/openapi/admin.yaml) | ["admin:read"] | Không |
| API-52398df52993 | U15 | `GET /admin/analytics/ab-tests/{testId}` | getAdminAbTest | [contracts/openapi/admin.yaml](../../../contracts/openapi/admin.yaml) | ["admin:read"] | Không |
| API-860e0649d1ae | U15 | `PATCH /admin/feature-flags/{flagKey}` | updateAdminFeatureFlag | [contracts/openapi/admin.yaml](../../../contracts/openapi/admin.yaml) | ["admin:write"] | Có |
| API-9cfbc35ce4ab | U12 | `GET /arena/discovery` | getArenaDiscovery | [contracts/openapi/arena.yaml](../../../contracts/openapi/arena.yaml) | Chưa khai báo | Không |
| API-13d0abe2f2aa | U12 | `GET /arena/modes/{modeId}` | getArenaMode | [contracts/openapi/arena.yaml](../../../contracts/openapi/arena.yaml) | Chưa khai báo | Không |
| API-39fc5a3ce79f | U12 | `GET /arena/challenges/{challengeId}` | getArenaChallenge | [contracts/openapi/arena.yaml](../../../contracts/openapi/arena.yaml) | Chưa khai báo | Không |
| API-0771c285cab3 | U12 | `POST /arena/challenges/{challengeId}/join` | joinArenaChallenge | [contracts/openapi/arena.yaml](../../../contracts/openapi/arena.yaml) | ["arena:join"] | Có |
| API-74a6bdea6ff1 | U01 | `POST /auth/register` | register | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Có |
| API-531e9b3b1aae | U01 | `POST /auth/login` | login | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Không |
| API-00d38ae921b4 | U01 | `POST /auth/login/mfa/verify` | verifyLoginMfaChallenge | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Không |
| API-5531c93df31d | U01 | `GET /auth/session` | getSession | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Không |
| API-0c12a766a3cb | U01 | `POST /auth/refresh` | refreshSession | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Không |
| API-1614a357371c | U01 | `POST /auth/logout` | logout | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Không |
| API-b57ebac823b3 | U01 | `POST /auth/mfa/verify` | verifyMfa | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Không |
| API-48b270dd967c | U01 | `POST /auth/mfa/setup/confirm` | confirmMfaSetup | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Không |
| API-e2e6d304db17 | U01 | `POST /auth/mfa/setup` | beginMfaSetup | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Không |
| API-d4c99f3b99a4 | U01 | `POST /auth/password-reset/request` | requestPasswordResetCode | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Không |
| API-5d7334d2a805 | U01 | `POST /auth/password/verify-current` | verifyCurrentPassword | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Không |
| API-8868204d75af | U01 | `POST /auth/password/change` | changePassword | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Có |
| API-11749cdc3992 | U01 | `POST /auth/password-reset/verify` | verifyPasswordResetCode | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Không |
| API-a841efa0a527 | U01 | `POST /auth/password-reset/confirm` | confirmPasswordReset | [contracts/openapi/auth.yaml](../../../contracts/openapi/auth.yaml) | Chưa khai báo | Không |
| API-add260a6fb71 | U06 | `GET /dca/advanced/overview` | getDCAAdvancedOverview | [contracts/openapi/dca.yaml](../../../contracts/openapi/dca.yaml) | ["dca:read"] | Không |
| API-758bd0fe7acf | U06 | `GET /dca/snapshot` | getDCASnapshot | [contracts/openapi/dca.yaml](../../../contracts/openapi/dca.yaml) | ["dca:read"] | Không |
| API-cf63f6a94e53 | U06 | `POST /dca/plans` | createDCAPlan | [contracts/openapi/dca.yaml](../../../contracts/openapi/dca.yaml) | ["dca:write"] | Có |
| API-76838f2db750 | U06 | `PATCH /dca/plans/{planId}` | updateDCAPlan | [contracts/openapi/dca.yaml](../../../contracts/openapi/dca.yaml) | ["dca:write"] | Có |
| API-0d0d1171aa70 | U06 | `DELETE /dca/plans/{planId}` | deleteDCAPlan | [contracts/openapi/dca.yaml](../../../contracts/openapi/dca.yaml) | ["dca:write"] | Có |
| API-e00b34da1f4e | U10 | `GET /discovery/search` | searchDiscovery | [contracts/openapi/discovery.yaml](../../../contracts/openapi/discovery.yaml) | Chưa khai báo | Không |
| API-47e6b2764c14 | U10 | `GET /discovery/topics/{topicId}` | getDiscoveryTopic | [contracts/openapi/discovery.yaml](../../../contracts/openapi/discovery.yaml) | Chưa khai báo | Không |
| API-22e7acf51644 | U07 | `GET /earn/snapshot` | getEarnSnapshot | [contracts/openapi/earn.yaml](../../../contracts/openapi/earn.yaml) | ["earn:read"] | Không |
| API-fe65af64249a | U07 | `GET /earn/transactions` | listEarnTransactions | [contracts/openapi/earn.yaml](../../../contracts/openapi/earn.yaml) | ["earn:read"] | Không |
| API-d8fa525fae24 | U07 | `POST /earn/subscriptions` | createEarnSubscription | [contracts/openapi/earn.yaml](../../../contracts/openapi/earn.yaml) | ["earn:subscribe"] | Có |
| API-7447c0651497 | U07 | `POST /earn/redemptions` | redeemEarnPosition | [contracts/openapi/earn.yaml](../../../contracts/openapi/earn.yaml) | ["earn:redeem"] | Có |
| API-91af570bba07 | U11 | `GET /launchpad/projects` | listLaunchpadProjects | [contracts/openapi/launchpad.yaml](../../../contracts/openapi/launchpad.yaml) | Chưa khai báo | Không |
| API-476a22135be5 | U11 | `GET /launchpad/projects/{projectId}` | getLaunchpadProject | [contracts/openapi/launchpad.yaml](../../../contracts/openapi/launchpad.yaml) | Chưa khai báo | Không |
| API-49aebda726c7 | U02 | `GET /market/overview` | getMarketOverview | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-f4b7d8302602 | U02 | `GET /market/movers` | getMarketMovers | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-622dac2808be | U02 | `GET /market/news` | getMarketNews | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-ac0d2bdb246c | U02 | `GET /market/calendar` | getMarketCalendar | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-f066b535a7fd | U02 | `GET /market/correlations` | getMarketCorrelations | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-97a2c7185b8f | U02 | `GET /market/unlocks` | getMarketTokenUnlocks | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-f7d151dfd789 | U02 | `GET /market/derivatives` | getMarketDerivatives | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-22c4d9bed186 | U02 | `GET /market/sentiment` | getMarketSentiment | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-c11ccad72b2a | U02 | `GET /market/signals` | getMarketSignals | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-378a2ce17f35 | U02 | `GET /market/price-alerts` | listMarketPriceAlerts | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | ["market:read"] | Không |
| API-ed150d4e9340 | U02 | `POST /market/price-alerts` | createMarketPriceAlert | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | ["market:alerts:write"] | Có |
| API-036690496a80 | U02 | `PATCH /market/price-alerts/{alertId}` | updateMarketPriceAlert | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | ["market:alerts:write"] | Có |
| API-906af8319c68 | U02 | `DELETE /market/price-alerts/{alertId}` | deleteMarketPriceAlert | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | ["market:alerts:write"] | Có |
| API-11210d3c67fe | U02 | `GET /market/pairs` | listMarketPairs | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-d88320f74069 | U02 | `GET /market/pairs/{pairId}` | getMarketPair | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-87c6f3d42795 | U02 | `GET /market/watchlist` | getMarketWatchlist | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | ["market:read"] | Không |
| API-f04cdda005b8 | U02 | `POST /market/watchlist` | addMarketWatchlistItem | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | ["market:watchlist:write"] | Có |
| API-0b83046e57c6 | U02 | `GET /market/pairs/{pairId}/orderbook` | getMarketOrderBook | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-a8470d6b44b7 | U02 | `GET /market/pairs/{pairId}/trades` | getMarketRecentTrades | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-eabc983922e7 | U02 | `GET /market/pairs/{pairId}/candles` | getMarketCandles | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | Chưa khai báo | Không |
| API-e25c2dbcee57 | U02 | `PATCH /market/watchlist/{watchlistId}` | updateMarketWatchlistItem | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | ["market:watchlist:write"] | Có |
| API-3e630cf19de3 | U02 | `DELETE /market/watchlist/{watchlistId}` | deleteMarketWatchlistItem | [contracts/openapi/market.yaml](../../../contracts/openapi/market.yaml) | ["market:watchlist:write"] | Có |
| API-71a4834a042d | U05 | `GET /p2p/frontend-view-status` | getP2PFrontendViewStatus | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-9a874e6c7045 | U05 | `GET /p2p/overview` | getP2POverview | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-1dbf01ed3424 | U05 | `GET /p2p/dashboard` | getP2PDashboard | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-5179ace1914c | U05 | `GET /p2p/achievements` | getP2PAchievements | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-e6efe22f7500 | U05 | `GET /p2p/ads/{adId}/analytics` | getP2PAdAnalytics | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-9ed6d7e636a5 | U05 | `GET /p2p/merchants/{merchantId}` | getP2PMerchantProfile | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-00c3f91277f1 | U05 | `POST /p2p/reports/merchants` | reportP2PMerchant | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-14a3f8a6bea7 | U05 | `GET /p2p/payment-methods` | listP2PPaymentMethods | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-8deedf37c672 | U05 | `POST /p2p/payment-methods` | createP2PPaymentMethod | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-b5ebebd342f3 | U05 | `PATCH /p2p/payment-methods/{methodId}` | updateP2PPaymentMethod | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-c0b5d7bf11ab | U05 | `DELETE /p2p/payment-methods/{methodId}` | deleteP2PPaymentMethod | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-32bbdce41575 | U05 | `GET /p2p/disputes` | listP2PDisputes | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-71ff535f06b8 | U05 | `GET /p2p/disputes/{disputeId}` | getP2PDispute | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-7c81f5d27bb7 | U05 | `POST /p2p/disputes/{disputeId}/messages` | sendP2PDisputeMessage | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-2ecbe1cf4564 | U05 | `POST /p2p/disputes/{disputeId}/escalate` | escalateP2PDispute | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-ba5c80d592c3 | U05 | `GET /p2p/blacklist` | listP2PBlacklist | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-56eefa0baaaf | U05 | `POST /p2p/blacklist` | createP2PBlacklistEntry | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-d2d86f6534f4 | U05 | `DELETE /p2p/blacklist/{entryId}` | removeP2PBlacklistEntry | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-0344de207cc7 | U05 | `GET /p2p/reviews` | listP2PReviews | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-96425c943a93 | U05 | `GET /p2p/security/2fa/settings` | getP2P2FASettings | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-c6a13cfad102 | U05 | `PATCH /p2p/security/2fa/methods/{methodId}` | updateP2P2FAMethod | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-189d0ffcf613 | U05 | `POST /p2p/security/2fa/primary` | setP2P2FAPrimaryMethod | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-adf2a40e19d1 | U05 | `PATCH /p2p/security/2fa/thresholds/{thresholdId}` | updateP2P2FAThreshold | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-e3ef0681da66 | U05 | `POST /p2p/security/2fa/authenticator/setup` | beginP2PAuthenticatorSetup | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-1bcc4c7c86d3 | U05 | `POST /p2p/security/2fa/authenticator/confirm` | confirmP2PAuthenticatorSetup | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-69616a5c56f4 | U05 | `GET /p2p/ads` | listP2PAds | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-7df8fe96ebe9 | U05 | `POST /p2p/ads` | createP2PAd | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-bbf1ae6f3b28 | U05 | `GET /p2p/ads/{adId}` | getP2PAd | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-3d6cc4592909 | U05 | `PATCH /p2p/ads/{adId}` | updateP2PAdStatus | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-b0be5ff21813 | U05 | `DELETE /p2p/ads/{adId}` | deleteP2PAd | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-4fe67563176c | U05 | `GET /p2p/orders` | listP2POrders | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-62209bc23b7a | U05 | `POST /p2p/orders` | createP2POrder | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-14bd22132e20 | U05 | `GET /p2p/orders/{orderId}` | getP2POrder | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-3b90783f6c7a | U05 | `POST /p2p/orders/{orderId}/mark-paid` | markP2POrderPaid | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-43fe3e6ad7e3 | U05 | `POST /p2p/orders/{orderId}/release` | releaseP2POrderEscrow | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-4d39f73bd15f | U05 | `POST /p2p/orders/{orderId}/release/challenge` | createP2PReleaseChallenge | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-a7ab7af7cad5 | U05 | `POST /p2p/orders/{orderId}/release/challenge/{challengeId}/verify` | verifyP2PReleaseChallenge | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-bdee1b8b6e1f | U05 | `POST /p2p/orders/{orderId}/cancel` | cancelP2POrder | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-132d64f570fb | U05 | `POST /p2p/orders/{orderId}/rate` | rateP2POrder | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-0001bd2af77b | U05 | `POST /p2p/orders/{orderId}/payment-proof` | submitP2PPaymentProof | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-47ddd10c05e2 | U05 | `GET /p2p/orders/{orderId}/chat` | getP2POrderChat | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Không |
| API-ec0cf271119e | U05 | `POST /p2p/orders/{orderId}/chat/messages` | sendP2PChatMessage | [contracts/openapi/p2p.yaml](../../../contracts/openapi/p2p.yaml) | Chưa khai báo | Có |
| API-2b1175fffafc | U13 | `GET /predictions/events` | listPredictionEvents | [contracts/openapi/predictions.yaml](../../../contracts/openapi/predictions.yaml) | Chưa khai báo | Không |
| API-431555b575d8 | U13 | `GET /predictions/events/{eventId}` | getPredictionEvent | [contracts/openapi/predictions.yaml](../../../contracts/openapi/predictions.yaml) | Chưa khai báo | Không |
| API-70cceef6b65e | U13 | `GET /predictions/positions` | listPredictionPositions | [contracts/openapi/predictions.yaml](../../../contracts/openapi/predictions.yaml) | Chưa khai báo | Không |
| API-e4fbfaea06b3 | U13 | `GET /predictions/rewards` | listPredictionRewards | [contracts/openapi/predictions.yaml](../../../contracts/openapi/predictions.yaml) | Chưa khai báo | Không |
| API-b8a3d1ec7f71 | U13 | `GET /predictions/leaderboard` | listPredictionLeaderboard | [contracts/openapi/predictions.yaml](../../../contracts/openapi/predictions.yaml) | Chưa khai báo | Không |
| API-d1347f65b33a | U13 | `GET /predictions/activity` | listPredictionActivity | [contracts/openapi/predictions.yaml](../../../contracts/openapi/predictions.yaml) | Chưa khai báo | Không |
| API-0d3da8cace68 | U13 | `POST /predictions/orders` | placePredictionOrder | [contracts/openapi/predictions.yaml](../../../contracts/openapi/predictions.yaml) | ["predictions:trade"] | Có |
| API-667a33fac4b2 | U13 | `GET /predictions/orders/{orderId}` | getPredictionOrderReceipt | [contracts/openapi/predictions.yaml](../../../contracts/openapi/predictions.yaml) | Chưa khai báo | Không |
| API-fd74eb11253e | U08 | `GET /profile` | getProfile | [contracts/openapi/profile.yaml](../../../contracts/openapi/profile.yaml) | ["profile:read"] | Không |
| API-9171668acf50 | U08 | `PATCH /profile` | updateProfile | [contracts/openapi/profile.yaml](../../../contracts/openapi/profile.yaml) | ["profile:write"] | Có |
| API-e9dc1e4bdf35 | U08 | `GET /profile/devices` | listTrustedDevices | [contracts/openapi/profile.yaml](../../../contracts/openapi/profile.yaml) | ["profile:read"] | Không |
| API-af0650aa61b2 | U08 | `POST /profile/devices/{deviceId}/revoke` | revokeDevice | [contracts/openapi/profile.yaml](../../../contracts/openapi/profile.yaml) | ["profile:security:write"] | Có |
| API-cc327e367b7d | U08 | `PATCH /profile/devices/{deviceId}/trust` | setDeviceTrust | [contracts/openapi/profile.yaml](../../../contracts/openapi/profile.yaml) | ["profile:security:write"] | Có |
| API-7384def75943 | U08 | `GET /profile/activity` | listProfileActivity | [contracts/openapi/profile.yaml](../../../contracts/openapi/profile.yaml) | ["profile:read"] | Không |
| API-f2ba76becf4f | U08 | `GET /profile/sub-accounts` | listSubAccounts | [contracts/openapi/profile.yaml](../../../contracts/openapi/profile.yaml) | ["profile:read"] | Không |
| API-7fb339065b3e | U14 | `GET /referral/overview` | getReferralOverview | [contracts/openapi/referral.yaml](../../../contracts/openapi/referral.yaml) | Chưa khai báo | Không |
| API-92eb6ef08142 | U09 | `GET /content/news` | listNews | [contracts/openapi/support.yaml](../../../contracts/openapi/support.yaml) | ["support:read"] | Không |
| API-75c588c238a3 | U09 | `GET /notifications` | listNotifications | [contracts/openapi/support.yaml](../../../contracts/openapi/support.yaml) | ["notifications:read"] | Không |
| API-3d361d373d8b | U09 | `POST /notifications/{notificationId}/read` | markNotificationRead | [contracts/openapi/support.yaml](../../../contracts/openapi/support.yaml) | ["notifications:write"] | Có |
| API-3d981f60c4fe | U09 | `GET /support/help` | getHelpCenter | [contracts/openapi/support.yaml](../../../contracts/openapi/support.yaml) | ["support:read"] | Không |
| API-659c3971d5ef | U09 | `GET /support/tickets` | listSupportTickets | [contracts/openapi/support.yaml](../../../contracts/openapi/support.yaml) | ["support:read"] | Không |
| API-1fb817f18db8 | U09 | `POST /support/tickets` | createSupportTicket | [contracts/openapi/support.yaml](../../../contracts/openapi/support.yaml) | ["support:write"] | Có |
| API-cf48b53d3394 | U03 | `GET /trading/copy/frontend-view-status` | getCopyFrontendViewStatus | [contracts/openapi/trading.yaml](../../../contracts/openapi/trading.yaml) | Chưa khai báo | Không |
| API-2c6bfe2a0408 | U03 | `GET /trading/copy/providers` | listCopyProviders | [contracts/openapi/trading.yaml](../../../contracts/openapi/trading.yaml) | Chưa khai báo | Không |
| API-c541bbf20d0d | U03 | `GET /trading/copy/providers/{providerId}` | getCopyProviderProfile | [contracts/openapi/trading.yaml](../../../contracts/openapi/trading.yaml) | Chưa khai báo | Không |
| API-d337b1675b95 | U03 | `GET /trading/copy/relationships` | listCopyRelationships | [contracts/openapi/trading.yaml](../../../contracts/openapi/trading.yaml) | ["trade:read"] | Không |
| API-5a69e77a5c28 | U03 | `POST /trading/copy/relationships` | createCopyRelationship | [contracts/openapi/trading.yaml](../../../contracts/openapi/trading.yaml) | ["trade:write"] | Có |
| API-6b2f1068fe7c | U03 | `POST /trading/copy/relationships/{copyId}/stop` | stopCopyRelationship | [contracts/openapi/trading.yaml](../../../contracts/openapi/trading.yaml) | ["trade:write"] | Có |
| API-e12a124fe009 | U03 | `GET /trading/analytics` | getTradingAnalytics | [contracts/openapi/trading.yaml](../../../contracts/openapi/trading.yaml) | ["trade:read"] | Không |
| API-22572e8a6535 | U03 | `GET /trading/orders` | listOpenOrders | [contracts/openapi/trading.yaml](../../../contracts/openapi/trading.yaml) | ["trade:read"] | Không |
| API-670243d74e4d | U03 | `POST /trading/orders` | placeOrder | [contracts/openapi/trading.yaml](../../../contracts/openapi/trading.yaml) | ["trade:write"] | Có |
| API-8287ac4126e2 | U03 | `GET /trading/positions` | listOpenPositions | [contracts/openapi/trading.yaml](../../../contracts/openapi/trading.yaml) | ["trade:read"] | Không |
| API-92e2ab2ab87d | U03 | `GET /trading/orders/history` | listOrderHistory | [contracts/openapi/trading.yaml](../../../contracts/openapi/trading.yaml) | ["trade:read"] | Không |
| API-acce3e42a305 | U03 | `PATCH /trading/orders/{orderId}` | modifyOrder | [contracts/openapi/trading.yaml](../../../contracts/openapi/trading.yaml) | ["trade:write"] | Có |
| API-feb6ffa74a80 | U03 | `POST /trading/orders/{orderId}/cancel` | cancelOrder | [contracts/openapi/trading.yaml](../../../contracts/openapi/trading.yaml) | ["trade:write"] | Có |
| API-5691ffe790f2 | U04 | `GET /wallet/assets` | getWalletAssets | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:read"] | Không |
| API-e5645fde8a5b | U04 | `GET /wallet/accounts` | getWalletAccounts | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:read"] | Không |
| API-6de4b6bd2886 | U04 | `GET /wallet/address-book` | getWalletAddressBook | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:read"] | Không |
| API-5a15ae0bc89c | U04 | `POST /wallet/address-book` | createWalletAddressBookEntry | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:address-book"] | Có |
| API-dfbe843985d6 | U04 | `PATCH /wallet/address-book/settings` | updateWalletAddressBookSettings | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:address-book"] | Có |
| API-d49d55cb3aba | U04 | `PATCH /wallet/address-book/{addressId}` | updateWalletAddressBookEntry | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:address-book"] | Có |
| API-ba5cd7e3c055 | U04 | `DELETE /wallet/address-book/{addressId}` | deleteWalletAddressBookEntry | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:address-book"] | Có |
| API-636b0f16eb83 | U04 | `GET /wallet/analytics/portfolio` | getPortfolioAnalytics | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:read"] | Không |
| API-d3161dfa7adf | U04 | `GET /wallet/dust-conversions/quote` | quoteWalletDustConversion | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:read"] | Không |
| API-1649db7e3668 | U04 | `POST /wallet/dust-conversions` | createWalletDustConversion | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:dust-convert"] | Có |
| API-90cda243001f | U04 | `GET /wallet/transactions` | getWalletTransactions | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:read"] | Không |
| API-8da6afce4192 | U04 | `GET /wallet/transactions/{transactionId}` | getWalletTransaction | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:read"] | Không |
| API-bd365da44dbe | U04 | `GET /wallet/deposit/networks` | getWalletDepositNetworks | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:read"] | Không |
| API-a7171eea71f5 | U04 | `GET /wallet/withdrawal/networks` | getWalletWithdrawalNetworks | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:read"] | Không |
| API-6a05460436a0 | U04 | `GET /wallet/network-status` | getWalletNetworkStatus | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:read"] | Không |
| API-eebbd76b29fb | U04 | `POST /wallet/transfers` | createWalletTransfer | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:transfer"] | Có |
| API-743337cd9ddd | U04 | `POST /wallet/withdrawals/challenge` | createWalletWithdrawalChallenge | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:withdraw"] | Không |
| API-8ccfa7a010b6 | U04 | `POST /wallet/withdrawals/challenge/{challengeId}/verify` | verifyWalletWithdrawalChallenge | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:withdraw"] | Không |
| API-23c0a9fd32ef | U04 | `POST /wallet/withdrawals` | createWalletWithdrawal | [contracts/openapi/wallet.yaml](../../../contracts/openapi/wallet.yaml) | ["wallet:withdraw"] | Có |

## Phạm vi file và cách tra cứu

Toàn bộ **882 file Git-tracked** tại baseline đã có path, SHA-256 và task ownership trong `TRACKING.json.files`, gồm mã, tests, config, contract, tài liệu, assets và policy. `not_assessed` là chưa phân loại việc cần sửa, không phải file có lỗi. Không cần sửa mọi file. Lọc task để biết chính xác file phải đọc trước mỗi lát cắt; ghi `reviewed_unchanged`, `changed`, `not_applicable` có lý do hoặc `retired` sau khi đối chiếu.

File mới của bộ kế hoạch được quản lý riêng theo thư mục này; file sản phẩm mới ở ngoài thư mục phải được thêm vào ledger. Checker không quét node_modules/dist/coverage/generated test artifacts hoặc env bí mật bị gitignore.
