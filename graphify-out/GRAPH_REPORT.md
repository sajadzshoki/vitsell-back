# Graph Report - digishop-back  (2026-09-27)

## Corpus Check
- 374 files · ~145,930 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2559 nodes · 3411 edges · 289 communities (236 shown, 53 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.61)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12dcbc3c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SellerMegaMenusController
- schema.ts
- MediaAsset
- Category
- imports
- BlogPost
- SellerPayout
- AdminRole
- SellerRefund
- AuthController
- Order
- devDependencies
- dependencies
- ProductAttribute
- StoreCampaign
- StoreDiscount
- NotificationCampaign
- Banner
- recommendation_service.ts
- WalletTransaction
- Profile
- Brand
- StaticPage
- AmazingDeal
- SellerController
- ProductQuestion
- Warehouse
- Product
- SellerReview
- seller_controller.ts
- utils/platform_settings.ts
- DiscountCode
- SellerReturn
- seller_order_detail.ts
- seller_customers_query.ts
- site_settings.ts
- index.ts
- StockMovement
- media_upload.ts
- campaign.ts
- discount.ts
- ContentPromo
- SellerShippingMethod
- ContentBlock
- .place
- validators/mega_menu.ts
- run
- CartItem
- inventory.ts
- exclude
- SellerListing
- utils/navigation_settings.ts
- Profile
- Notification
- SellerShop
- ZarinpalService
- seller_adjustments.ts
- seller_payments_query.ts
- User
- .place
- seller_orders_query.ts
- attribute.ts
- validators/category.ts
- .place
- admin_rbac.ts
- product_variants.ts
- queryMarketingSummary
- seller_reconciliation.ts
- validators/brand.ts
- reviews.ts
- vitsell API (AdonisJS 7 + Lucid + Postgres)
- ContactMessage
- SellerSeoController
- CartItem
- product.ts
- SellerCustomersController
- customers.ts
- page.ts
- ActivityController
- resolveDiscountAmount
- mega_menu_filter.ts
- SellerListing
- seller_schedule_filters.ts
- admins.ts
- validators/banner.ts
- blog.ts
- orders.ts
- questions.ts
- refunds.ts
- returns.ts
- settlements.ts
- api_provider.ts
- verify_runtime_e2e.ts
- Payment
- UserTransformer
- url.ts
- KavenegarService
- technolife.ts
- seller_reviews_query.ts
- audit.ts
- listings.ts
- auth.ts
- مستند Routeهای API — vitsell Back
- routes.d.ts
- content_promos_controller.ts
- listing_write_service.ts
- SellerReconciliationController
- seller_order.ts
- ProductsClear
- seller_questions_query.ts
- media.ts
- notifications_query.ts
- promotions_query.ts
- roles.ts
- shipping.ts
- transactions.ts
- validators/user.ts
- خلاصه سریع Production API
- data.d.ts
- AccessTokensController
- MegaMenuController
- SellerAboutController
- SellerAdjustmentsController
- SellerAuditController
- SellerNavigationController
- SellerPaymentsController
- SellerSettingsController
- SellerTransactionsController
- UploadController
- HttpExceptionHandler
- AdminUserRole
- order.ts
- auth_origins.ts
- price.ts
- seller_adjustments.ts
- about.ts
- adjustments.ts
- banners_query.ts
- blog_query.ts
- media_query.ts
- validators/navigation_settings.ts
- order_detail.ts
- pages_query.ts
- reports.ts
- seller_payments.ts
- drive.ts
- encryption.ts
- hash.ts
- logger.ts
- export_seed.ts
- NewAccountController
- SellerMarketingController
- SellerReportsController
- SellerSystemController
- AdminMiddleware
- AuthMiddleware
- ForceJsonResponseMiddleware
- SilentAuthMiddleware
- categories.ts
- deals_query.ts
- marketing.ts
- reconciliation.ts
- console.ts
- server.ts
- test.ts
- app.ts
- cors.ts
- set_local_admin.ts
- validator.ts
- controllers.ts
- events.ts
- listeners.ts
- validators/platform_settings.ts
- validators/seo_redirects.ts
- validators/seo_settings.ts
- bodyparser.ts
- database.ts
- session.ts
- shield.ts
- entrypoint.sh
- minio-init.sh
- kernel.ts
- allowScripts
- boundaries
- normalizer.ts
- order.ts
- parser.spec.ts
- queryMarketingSummary
- seller_reconciliation.ts
- seller_inventory_query.ts
- payment_return_url.ts
- category_mapper.ts
- seller_categories_query.ts
- seller_promotions_query.ts
- discount_codes_controller.ts
- footer.ts
- content_promos_controller.ts
- seller_questions_query.ts
- .run
- seller_sales.ts
- mega_menu.spec.ts
- seller_mega_menus_controller.ts
- MegaMenuItem
- MegaMenuSection
- mega_menu_seeder.ts
- OrderItemRow
- catalog_stock.ts
- order.ts
- account_controller.ts
- seller_return.ts

## God Nodes (most connected - your core abstractions)
1. `Product` - 39 edges
2. `Category` - 33 edges
3. `SellerController` - 28 edges
4. `SellerOrder` - 27 edges
5. `ContentBlock` - 26 edges
6. `ProductQuestion` - 23 edges
7. `SellerListing` - 20 edges
8. `imports` - 20 edges
9. `SellerMegaMenusController` - 18 edges
10. `Banner` - 18 edges

## Surprising Connections (you probably didn't know these)
- `ensureMobileCategory()` --references--> `Category`  [EXTRACTED]
  tests/functional/mega_menu.spec.ts → app/models/category.ts
- `makeProduct()` --references--> `Product`  [EXTRACTED]
  tests/functional/checkout_seller.spec.ts → app/models/product.ts
- `run()` --references--> `AmazingDeal`  [EXTRACTED]
  database/seeders/main_seeder.ts → app/models/amazing_deal.ts
- `run()` --references--> `BlogPost`  [EXTRACTED]
  database/seeders/main_seeder.ts → app/models/blog_post.ts
- `run()` --references--> `Category`  [EXTRACTED]
  database/seeders/main_seeder.ts → app/models/category.ts

## Import Cycles
- None detected.

## Communities (289 total, 53 thin omitted)

### Community 0 - "SellerMegaMenusController"
Cohesion: 0.16
Nodes (7): applyReorder(), SellerMegaMenusController, MegaMenu, MegaMenuStatus, column, dateTime, hasMany

### Community 1 - "schema.ts"
Cohesion: 0.11
Nodes (54): AddressSchema, AdminRoleSchema, AdminUserRoleSchema, AmazingDealSchema, AuditLogSchema, AuthAccessTokenSchema, BannerSchema, BlogPostSchema (+46 more)

### Community 3 - "MediaAsset"
Cohesion: 0.06
Nodes (28): filenameFromUrl(), optionalInt(), SellerMediaController, MediaAsset, MediaKind, column, dateTime, extFromUrl() (+20 more)

### Community 4 - "Category"
Cohesion: 0.20
Nodes (7): CategoriesController, deleteCategoryRecord(), Category, belongsTo, column, dateTime, hasMany

### Community 5 - "imports"
Cohesion: 0.10
Nodes (20): imports, #abilities/*, #config/*, #controllers/*, #database/*, #events/*, #exceptions/*, #generated/* (+12 more)

### Community 6 - "BlogPost"
Cohesion: 0.07
Nodes (19): block(), chunkBannerRows(), ContentController, deriveActive(), emptySeo(), parseOptionalDate(), resolveStatus(), SellerBlogController (+11 more)

### Community 7 - "SellerPayout"
Cohesion: 0.07
Nodes (31): jalaliishDate(), nextSettlementId(), resolveSiteShop(), SellerSettlementsController, SellerPayout, SellerSettlementSource, SellerSettlementStatus, belongsTo (+23 more)

### Community 8 - "AdminRole"
Cohesion: 0.07
Nodes (19): SellerRolesController, AdminRole, column, dateTime, manyToMany, countActiveSuperAdmins(), ensureSystemAdminRoles(), applyAdminFilters() (+11 more)

### Community 9 - "SellerRefund"
Cohesion: 0.09
Nodes (27): nextRefundId(), SellerRefundsController, SELLER_REFUND_TRANSITIONS, SellerRefund, SellerRefundItem, SellerRefundStatus, column, dateTime (+19 more)

### Community 10 - "AuthController"
Cohesion: 0.08
Nodes (18): adminProfilePayload(), AuthController, ensureProfile(), loginPasswordValidator, phoneRule, rejectAdminOnStore(), requestOtpValidator, resetPasswordValidator (+10 more)

### Community 11 - "Order"
Cohesion: 0.16
Nodes (5): AccountController, Address, belongsTo, column, dateTime

### Community 12 - "devDependencies"
Cohesion: 0.06
Nodes (33): @adonisjs/assembler, @adonisjs/eslint-config, @adonisjs/prettier-config, @adonisjs/tsconfig, eslint, hot-hook, @japa/assert, @japa/plugin-adonisjs (+25 more)

### Community 13 - "dependencies"
Cohesion: 0.06
Nodes (33): @adonisjs/auth, @adonisjs/core, @adonisjs/cors, @adonisjs/drive, @adonisjs/lucid, @adonisjs/session, @adonisjs/shield, @aws-sdk/client-s3 (+25 more)

### Community 14 - "ProductAttribute"
Cohesion: 0.07
Nodes (29): normalizeValues(), SellerAttributesController, slugify(), AttributeStatus, AttributeType, AttributeValue, ProductAttribute, column (+21 more)

### Community 15 - "StoreCampaign"
Cohesion: 0.12
Nodes (17): emptySeo(), normalizeSeo(), normalizeTargeting(), parseDate(), SellerCampaignsController, slugify(), stringList(), emptySeo() (+9 more)

### Community 16 - "StoreDiscount"
Cohesion: 0.12
Nodes (19): normalizeTargeting(), normalizeValue(), optionalInt(), parseDate(), parseOptionalDate(), SellerDiscountsController, slugify(), validateSchedule() (+11 more)

### Community 17 - "NotificationCampaign"
Cohesion: 0.09
Nodes (19): audienceFields, audienceGroupEnum, audienceTypeEnum, createCampaignId(), previewValidator, SellerNotificationsController, storeValidator, typeEnum (+11 more)

### Community 18 - "Banner"
Cohesion: 0.31
Nodes (14): AnyRecord, array(), extractNextData(), extractReviewImages(), extractSpecs(), findProductPageData(), imageValue(), isVideoMedia() (+6 more)

### Community 19 - "recommendation_service.ts"
Cohesion: 0.10
Nodes (20): storeValidator, WishlistController, ActivityEventType, belongsTo, column, dateTime, UserActivity, belongsTo (+12 more)

### Community 20 - "WalletTransaction"
Cohesion: 0.08
Nodes (24): buildSummary(), ensureWallet(), jalaliishDateTime(), maskCardNumber(), topUpValidator, WalletController, withdrawValidator, belongsTo (+16 more)

### Community 21 - "Profile"
Cohesion: 0.26
Nodes (12): asString(), defaultNavigationSettings, healCategoryBrowseLink(), loadNavigationSettings(), loadPublicNavigation(), NavBottomLinkPayload, NavigationSettingsPayload, NavQuickLinkPayload (+4 more)

### Community 22 - "Brand"
Cohesion: 0.09
Nodes (23): deleteBrandRecord(), DeleteBrandResult, emptySeo(), listedProductCountByBrand(), normalizeSeo(), SellerBrandsController, slugify(), Brand (+15 more)

### Community 23 - "StaticPage"
Cohesion: 0.06
Nodes (32): parseOptionalDate(), SellerBannersController, slugify(), syncHeroSlidesFromBanners(), AuditAction, AuditEntity, AuditLog, belongsTo (+24 more)

### Community 24 - "AmazingDeal"
Cohesion: 0.13
Nodes (12): activeValidator, bulkStoreValidator, DealsController, idRule, makeDealId(), parseDate(), storeValidator, updateValidator (+4 more)

### Community 25 - "SellerController"
Cohesion: 0.12
Nodes (7): deleteListingRecord(), SellerController, SellerOrder, belongsTo, column, dateTime, hasMany

### Community 26 - "ProductQuestion"
Cohesion: 0.13
Nodes (7): jalaliishDate(), SellerQuestionsController, ProductQuestion, ProductQuestionAnswer, belongsTo, column, dateTime

### Community 27 - "Warehouse"
Cohesion: 0.14
Nodes (12): SellerWarehousesController, slugifyCode(), column, dateTime, Warehouse, WarehouseStatus, applyFilters(), clearDefaultWarehouses() (+4 more)

### Community 28 - "Product"
Cohesion: 0.15
Nodes (9): ProductsController, Product, belongsTo, column, dateTime, hasMany, findDuplicateProduct(), ProductsClear (+1 more)

### Community 29 - "SellerReview"
Cohesion: 0.16
Nodes (7): defaultShopId(), ensureSellerReviewMirrors(), SellerReviewsController, SellerReview, belongsTo, column, dateTime

### Community 30 - "seller_controller.ts"
Cohesion: 0.14
Nodes (14): assertListingCategory(), DeleteListingResult, emptyProductSeo(), footerValidator, jalaliishDate(), listingProductFields, listingSeoSchema, listingStatusEnum (+6 more)

### Community 31 - "utils/platform_settings.ts"
Cohesion: 0.21
Nodes (17): asBool(), asNumber(), asString(), CLEARABLE_IMAGE_KEYS, clearedImageValue(), defaultPlatformSettings, emailHref(), hasOwn() (+9 more)

### Community 32 - "DiscountCode"
Cohesion: 0.18
Nodes (5): DiscountCodesController, parseOptionalDate(), DiscountCode, column, dateTime

### Community 33 - "SellerReturn"
Cohesion: 0.18
Nodes (9): nextReturnId(), SellerReturnsController, SellerReturn, column, dateTime, applyFilters(), querySellerReturns(), ReturnQuery (+1 more)

### Community 34 - "seller_order_detail.ts"
Cohesion: 0.06
Nodes (36): CartController, upsertValidator, CheckoutController, isPaymentMethodEnabled(), jalaliishDate(), paymentLabel(), placeValidator, shippingLabel() (+28 more)

### Community 35 - "seller_customers_query.ts"
Cohesion: 0.27
Nodes (14): applyFilters(), applySort(), baseFrom(), baseSelect(), countCustomers(), CustomerListRow, CustomerStatus, getSellerCustomerDetail() (+6 more)

### Community 36 - "site_settings.ts"
Cohesion: 0.29
Nodes (14): defaultSiteSettings, digitsOnly(), emailHref(), loadFooterWithSiteOverlay(), loadSiteSettings(), phoneHref(), resolveAdminPhone(), resolveAdminUser() (+6 more)

### Community 37 - "index.ts"
Cohesion: 0.15
Nodes (10): placeholder, registry, @tuyau/core/types, UserRegistry, ParamValue, ApiDefinition, @japa/api-client/types, plugins (+2 more)

### Community 38 - "StockMovement"
Cohesion: 0.13
Nodes (10): SellerInventoryController, SellerMovementsController, StockMovement, StockMovementType, column, dateTime, applyFilters(), MovementQuery (+2 more)

### Community 39 - "media_upload.ts"
Cohesion: 0.06
Nodes (28): fieldPolicySchema, importValidator, previewValidator, SellerTechnolifeImporterController, ProductImportBatch, column, dateTime, hasMany (+20 more)

### Community 40 - "campaign.ts"
Cohesion: 0.13
Nodes (14): bulkCampaignDeleteValidator, bulkCampaignStatusValidator, campaignBody, CampaignsQuery, campaignsQueryValidator, campaignStatusValidator, idRule, manualStatuses (+6 more)

### Community 41 - "discount.ts"
Cohesion: 0.13
Nodes (14): bulkDiscountDeleteValidator, bulkDiscountStatusValidator, discountBody, DiscountsQuery, discountsQueryValidator, discountStatuses, discountStatusValidator, discountTypes (+6 more)

### Community 42 - "ContentPromo"
Cohesion: 0.24
Nodes (5): applyFields(), ContentPromosController, ContentPromo, column, dateTime

### Community 43 - "SellerShippingMethod"
Cohesion: 0.20
Nodes (6): SellerShippingController, slugifyIdPart(), SellerShippingMethod, SellerShippingMethodStatus, column, dateTime

### Community 44 - "ContentBlock"
Cohesion: 0.18
Nodes (10): ContentBlock, column, dateTime, loadAboutPage(), saveAboutPage(), block(), emptyContact, FooterPayload (+2 more)

### Community 45 - ".place"
Cohesion: 0.21
Nodes (9): CartLine, CheckoutError, CheckoutService, dateKey(), jalaliishDate(), paymentLabel(), PlaceCheckoutInput, shippingLabel() (+1 more)

### Community 46 - "validators/mega_menu.ts"
Cohesion: 0.14
Nodes (13): filterSchema, itemTypeEnum, megaMenusQueryValidator, megaMenuStatusValidator, reorderMegaMenuValidator, slugRule, statusEnum, storeMegaMenuItemValidator (+5 more)

### Community 47 - "run"
Cohesion: 0.15
Nodes (10): displayName(), jalaliishDate(), refreshProductRating(), SORTS, storeQuestionValidator, storeReviewValidator, ProductReview, belongsTo (+2 more)

### Community 48 - "CartItem"
Cohesion: 0.11
Nodes (18): Admin API, Admin UI, Architecture, Audit findings (Phase 1), Category import, CLI, Configuration, Duplicate strategy (+10 more)

### Community 49 - "inventory.ts"
Cohesion: 0.15
Nodes (12): adjustInventoryValidator, InventoryQuery, inventoryQueryValidator, MovementsQuery, movementsQueryValidator, movementTypes, storeMovementValidator, storeWarehouseValidator (+4 more)

### Community 50 - "exclude"
Cohesion: 0.15
Nodes (12): @adonisjs/tsconfig/tsconfig.app.json, bin/verify_prod_fail_closed.ts, build, node_modules, scripts, tests, compilerOptions, jsx (+4 more)

### Community 51 - "SellerListing"
Cohesion: 0.20
Nodes (8): Order, belongsTo, column, dateTime, hasMany, hasOne, listNotificationUsers(), resolveAudienceUserIds()

### Community 52 - "utils/navigation_settings.ts"
Cohesion: 0.35
Nodes (12): asRecord(), collectOffer(), extractImages(), extractJsonLdBlocks(), extractSpecsFromHtml(), extractVariantsFromHtml(), findBreadcrumbPath(), findProductNode() (+4 more)

### Community 53 - "Profile"
Cohesion: 0.13
Nodes (9): ensureProfile(), loadStaff(), rolesIncludeSuper(), SellerAdminsController, SellerCustomersController, Profile, belongsTo, column (+1 more)

### Community 54 - "Notification"
Cohesion: 0.18
Nodes (10): TechnolifeAvailability, TechnolifeColor, TechnolifeDuplicateMatch, TechnolifeImportErrorCode, TechnolifeImportItemResult, TechnolifeNormalizedProduct, TechnolifeParsedProduct, TechnolifePreviewResult (+2 more)

### Community 55 - "SellerShop"
Cohesion: 0.13
Nodes (11): SellerShop, belongsTo, column, dateTime, hasMany, __dirname, loadJson(), run() (+3 more)

### Community 56 - "ZarinpalService"
Cohesion: 0.20
Nodes (9): exports, ./data, ./registry, license, name, prettier, private, type (+1 more)

### Community 57 - "seller_adjustments.ts"
Cohesion: 0.31
Nodes (5): assertAllowedTechnolifeApiUrl(), isRetryableStatus(), sleep(), TechnolifeClient, TechnolifeFetchError

### Community 58 - "seller_payments_query.ts"
Cohesion: 0.31
Nodes (10): applyFilters(), buildSellerPayments(), findSellerPayment(), inferGateway(), mapStatus(), projectOrderPayment(), querySellerPayments(), SellerFinancePaymentStatus (+2 more)

### Community 59 - "User"
Cohesion: 0.20
Nodes (6): column, dateTime, hasOne, manyToMany, User, beforeSave

### Community 60 - ".place"
Cohesion: 0.39
Nodes (11): asType(), createSeoRedirect(), deleteSeoRedirect(), loadSeoRedirects(), normalizePath(), normalizeSeoRedirect(), normalizeSeoRedirects(), saveSeoRedirects() (+3 more)

### Community 61 - "seller_orders_query.ts"
Cohesion: 0.47
Nodes (9): applyDerivedPayment(), applyDerivedShipping(), applyOrderFilters(), applySort(), listOrderPaymentMethods(), OrderQuery, paymentMethodOptions(), querySellerOrders() (+1 more)

### Community 62 - "attribute.ts"
Cohesion: 0.20
Nodes (9): attributeFields, AttributesQuery, attributesQueryValidator, attributeStatusValidator, attributeTypes, slugRule, storeAttributeValidator, updateAttributeValidator (+1 more)

### Community 63 - "validators/category.ts"
Cohesion: 0.18
Nodes (9): bulkCategoryDeleteValidator, categoryFields, idRule, pageMetaSchema, seoSchema, storeCategoryValidator, subSchema, suggestedSchema (+1 more)

### Community 64 - ".place"
Cohesion: 0.11
Nodes (18): scripts, build, dev, format, lint, products:clear, start, technolife:clear (+10 more)

### Community 65 - "admin_rbac.ts"
Cohesion: 0.22
Nodes (3): AdminRoleStatus, AdminStaffStatus, SYSTEM_ROLE_META

### Community 66 - "product_variants.ts"
Cohesion: 0.28
Nodes (7): catalogForVariant(), findProductVariant(), ProductVariant, ProductVariantAxis, ProductVariantOption, productVariantPrice(), productVariants()

### Community 67 - "queryMarketingSummary"
Cohesion: 0.24
Nodes (10): CategoryPageMeta, CategoryStatus, CategorySub, CategorySuggestedItem, emptySeo(), looksLikeMediaUrl(), publicCategoryIcon(), publicPageMeta() (+2 more)

### Community 68 - "seller_reconciliation.ts"
Cohesion: 0.12
Nodes (13): emptySeo(), normalizePath(), parseOptionalDate(), SellerPagesController, emptySeo(), PageStatus, StaticPage, column (+5 more)

### Community 69 - "validators/brand.ts"
Cohesion: 0.20
Nodes (9): brandFields, BrandsQuery, brandsQueryValidator, brandStatusValidator, bulkBrandDeleteValidator, seoSchema, slugRule, storeBrandValidator (+1 more)

### Community 70 - "reviews.ts"
Cohesion: 0.22
Nodes (8): bulkReviewModerationValidator, moderationStatuses, replyReviewValidator, ReviewsQuery, reviewsQueryValidator, reviewStatuses, updateReviewModerationValidator, updateReviewTextValidator

### Community 71 - "vitsell API (AdonisJS 7 + Lucid + Postgres)"
Cohesion: 0.22
Nodes (8): Env, Frontend, Local without Docker API (Postgres still via compose), Main routes (`/api/v1`), Quick start (Docker Desktop), Requirements, Stack, vitsell API (AdonisJS 7 + Lucid + Postgres)

### Community 72 - "ContactMessage"
Cohesion: 0.25
Nodes (4): ContactController, ContactMessage, column, dateTime

### Community 74 - "CartItem"
Cohesion: 0.29
Nodes (9): ADJUSTMENT_TYPES, asType(), createFinanceAdjustment(), loadFinanceAdjustments(), normalizeAdjustment(), querySellerAdjustments(), saveFinanceAdjustments(), SellerFinanceAdjustmentRow (+1 more)

### Community 75 - "product.ts"
Cohesion: 0.39
Nodes (8): detectDiscrepancies(), FinanceDiscrepancyRow, FinanceDiscrepancySeverity, loadReconciledIds(), markDiscrepancyResolved(), querySellerReconciliation(), saveReconciledIds(), unmarkDiscrepancyResolved()

### Community 76 - "SellerCustomersController"
Cohesion: 0.40
Nodes (8): asText(), DeleteCategoryResult, emptySeo(), normalizePageMeta(), normalizeSeo(), normalizeSubs(), normalizeSuggested(), resolveParentId()

### Community 77 - "customers.ts"
Cohesion: 0.25
Nodes (7): bulkCustomerStatusValidator, CustomersQuery, customersQueryValidator, customerStatuses, sortOptions, updateCustomerStatusValidator, updateCustomerValidator

### Community 78 - "page.ts"
Cohesion: 0.25
Nodes (7): idRule, pageFields, pageStatusValidator, sectionSchema, seoSchema, storePageValidator, updatePageValidator

### Community 79 - "ActivityController"
Cohesion: 0.29
Nodes (3): ActivityController, eventSchema, storeValidator

### Community 80 - "resolveDiscountAmount"
Cohesion: 0.33
Nodes (3): DiscountResolveError, isDiscountLive(), resolveDiscountAmount()

### Community 81 - "mega_menu_filter.ts"
Cohesion: 0.48
Nodes (5): asAttrs(), asStringArray(), MegaMenuFilterDefinition, normalizeMegaMenuFilter(), parseStoredFilter()

### Community 82 - "SellerListing"
Cohesion: 0.22
Nodes (7): SellerListing, belongsTo, column, dateTime, productsToCatalogWithStock(), productToCatalogWithStock(), stockByProductIds()

### Community 83 - "seller_schedule_filters.ts"
Cohesion: 0.33
Nodes (4): applyActiveScheduleStatus(), countActiveScheduleBuckets(), ScheduleListStatus, scheduleListStatuses

### Community 84 - "admins.ts"
Cohesion: 0.29
Nodes (6): adminFields, AdminsQuery, adminsQueryValidator, adminStatusValidator, storeAdminValidator, updateAdminValidator

### Community 85 - "validators/banner.ts"
Cohesion: 0.29
Nodes (6): bannerActiveValidator, bannerFields, idRule, placements, storeBannerValidator, updateBannerValidator

### Community 86 - "blog.ts"
Cohesion: 0.29
Nodes (6): blogFields, blogStatusValidator, idRule, seoSchema, storeBlogValidator, updateBlogValidator

### Community 87 - "orders.ts"
Cohesion: 0.29
Nodes (6): OrdersQuery, ordersQueryValidator, orderStatuses, paymentStatuses, shippingStatuses, sortOptions

### Community 88 - "questions.ts"
Cohesion: 0.29
Nodes (6): QuestionsQuery, questionsQueryValidator, questionStatuses, replyQuestionValidator, setQuestionVerifiedValidator, updateQuestionValidator

### Community 89 - "refunds.ts"
Cohesion: 0.29
Nodes (6): refundItem, RefundsQuery, refundsQueryValidator, refundStatuses, storeRefundValidator, updateRefundStatusValidator

### Community 90 - "returns.ts"
Cohesion: 0.29
Nodes (6): returnItem, ReturnsQuery, returnsQueryValidator, returnStatuses, storeReturnValidator, updateReturnStatusValidator

### Community 91 - "settlements.ts"
Cohesion: 0.29
Nodes (6): settlementSources, SettlementsQuery, settlementsQueryValidator, settlementStatuses, storeSettlementValidator, updateSettlementStatusValidator

### Community 92 - "api_provider.ts"
Cohesion: 0.29
Nodes (5): @adonisjs/core/http, ApiSerializer, HttpContext, serialize, serializer

### Community 93 - "verify_runtime_e2e.ts"
Cohesion: 0.48
Nodes (6): api(), Json, login(), main(), record(), results

### Community 94 - "Payment"
Cohesion: 0.52
Nodes (6): decodeBasicHtmlEntities(), normalizeBrandKey(), normalizePersianText(), splitTechnolifeBrand(), stripTags(), toAsciiDigits()

### Community 96 - "url.ts"
Cohesion: 0.32
Nodes (11): BLOCKED_HOSTS, extractTechnolifeCategoryPath(), extractTechnolifeProductId(), isPrivateIpv4(), normalizeImageUrl(), parseAllowedTechnolifeUrl(), UrlKind, UrlValidationResult (+3 more)

### Community 98 - "technolife.ts"
Cohesion: 0.29
Nodes (4): ALLOWED_HOSTS, technolifeConfig, TechnolifeFieldPolicy, TechnolifeImportMode

### Community 99 - "seller_reviews_query.ts"
Cohesion: 0.53
Nodes (5): applyFilters(), querySellerReviews(), ReviewModeration, ReviewQuery, statusCounts()

### Community 100 - "audit.ts"
Cohesion: 0.33
Nodes (5): auditActions, auditEntities, AuditQuery, auditQueryValidator, storeAuditValidator

### Community 101 - "listings.ts"
Cohesion: 0.29
Nodes (6): bulkListingsDeleteValidator, ListingsQuery, listingsQueryValidator, listingStatuses, sorts, stockBuckets

### Community 102 - "auth.ts"
Cohesion: 0.33
Nodes (5): @adonisjs/auth/types, @adonisjs/core/types, authConfig, Authenticators, EventsList

### Community 103 - "مستند Routeهای API — vitsell Back"
Cohesion: 0.33
Nodes (5): Auth, Cart / wishlist / account / checkout (auth مگر خلافش گفته شود), Catalog & content, Notifications & seller (auth), مستند Routeهای API — vitsell Back

### Community 104 - "routes.d.ts"
Cohesion: 0.50
Nodes (4): @adonisjs/core/types/http, ParamValue, RoutesList, ScannedRoutes

### Community 105 - "content_promos_controller.ts"
Cohesion: 0.67
Nodes (3): applyFilters(), DealQuery, querySellerDeals()

### Community 106 - "listing_write_service.ts"
Cohesion: 0.29
Nodes (8): assertActiveCategory(), emptySeo(), ListingProductInput, ListingWriteResult, ListingWriteService, normalizeProductSeo(), resolveSiteShop(), slugify()

### Community 108 - "seller_order.ts"
Cohesion: 0.40
Nodes (4): SELLER_ORDER_TRANSITIONS, SellerOrderAddress, SellerOrderItem, SellerOrderStatus

### Community 109 - "ProductsClear"
Cohesion: 0.25
Nodes (4): ContainerBindingsMiddleware, @adonisjs/core/http, HttpContext, SellerMiddleware

### Community 110 - "seller_questions_query.ts"
Cohesion: 0.29
Nodes (5): emptySeo(), ProductColor, ProductSpec, applyDealToCatalog(), dealPriceFrom()

### Community 111 - "media.ts"
Cohesion: 0.40
Nodes (4): bulkDeleteMediaValidator, kinds, registerMediaValidator, updateMediaValidator

### Community 112 - "notifications_query.ts"
Cohesion: 0.40
Nodes (4): NotificationsQuery, notificationsQueryValidator, statuses, types

### Community 113 - "promotions_query.ts"
Cohesion: 0.40
Nodes (4): ContentPromosQuery, contentPromosQueryValidator, DiscountCodesQuery, discountCodesQueryValidator

### Community 114 - "roles.ts"
Cohesion: 0.40
Nodes (4): RolesQuery, rolesQueryValidator, storeRoleValidator, updateRoleValidator

### Community 115 - "shipping.ts"
Cohesion: 0.40
Nodes (4): createShippingMethodValidator, ShippingMethodsQuery, shippingMethodsQueryValidator, updateShippingMethodValidator

### Community 116 - "transactions.ts"
Cohesion: 0.40
Nodes (4): TransactionsQuery, transactionsQueryValidator, transactionStatuses, transactionTypes

### Community 118 - "خلاصه سریع Production API"
Cohesion: 0.40
Nodes (4): Docker روی سرور — نکته حیاتی, vitsell Backend — Deploy, خلاصه سریع Production API, دامنه‌های production (vitsell)

### Community 119 - "data.d.ts"
Cohesion: 0.50
Nodes (3): Data, User, Variants

### Community 131 - "AdminUserRole"
Cohesion: 0.50
Nodes (3): AdminUserRole, column, dateTime

### Community 132 - "order.ts"
Cohesion: 0.36
Nodes (6): BRAND_STRIP, escapeRegExp(), extractProductLine(), extractSeriesLabel(), extractStorageLabel(), toPersianDigits()

### Community 133 - "auth_origins.ts"
Cohesion: 0.83
Nodes (3): assertAdminPanelRequest(), assertStorefrontRequest(), normalizeOrigin()

### Community 134 - "price.ts"
Cohesion: 0.70
Nodes (4): normalizeToToman(), parsePersianPriceToToman(), parsePriceNumber(), rialToToman()

### Community 135 - "seller_adjustments.ts"
Cohesion: 0.36
Nodes (8): applyListingFilters(), applyListingSort(), applyProductJoin(), ListingQuery, listingStatusCounts(), parseDayEnd(), parseDayStart(), querySellerListings()

### Community 136 - "about.ts"
Cohesion: 0.50
Nodes (3): aboutItem, aboutValidator, seoSchema

### Community 137 - "adjustments.ts"
Cohesion: 0.50
Nodes (3): adjustmentsQueryValidator, adjustmentTypes, storeAdjustmentValidator

### Community 138 - "banners_query.ts"
Cohesion: 0.50
Nodes (3): BannersQuery, bannersQueryValidator, placements

### Community 139 - "blog_query.ts"
Cohesion: 0.50
Nodes (3): BlogQuery, blogQueryValidator, blogStatuses

### Community 140 - "media_query.ts"
Cohesion: 0.50
Nodes (3): mediaKinds, MediaQuery, mediaQueryValidator

### Community 141 - "validators/navigation_settings.ts"
Cohesion: 0.50
Nodes (3): bottomLinkSchema, navigationSettingsValidator, quickLinkSchema

### Community 142 - "order_detail.ts"
Cohesion: 0.50
Nodes (3): orderNoteValidator, orderRefundValidator, orderTrackingValidator

### Community 143 - "pages_query.ts"
Cohesion: 0.50
Nodes (3): PagesQuery, pagesQueryValidator, pageStatuses

### Community 144 - "reports.ts"
Cohesion: 0.50
Nodes (3): periodIds, ReportsQuery, reportsQueryValidator

### Community 145 - "seller_payments.ts"
Cohesion: 0.50
Nodes (3): paymentStatuses, SellerPaymentsQuery, sellerPaymentsQueryValidator

### Community 146 - "drive.ts"
Cohesion: 0.50
Nodes (3): @adonisjs/drive/types, driveConfig, DriveDisks

### Community 147 - "encryption.ts"
Cohesion: 0.50
Nodes (3): @adonisjs/core/types, encryptionConfig, EncryptorsList

### Community 148 - "hash.ts"
Cohesion: 0.50
Nodes (3): @adonisjs/core/types, hashConfig, HashersList

### Community 149 - "logger.ts"
Cohesion: 0.50
Nodes (3): @adonisjs/core/types, loggerConfig, LoggersList

### Community 259 - "allowScripts"
Cohesion: 0.40
Nodes (5): allowScripts, better-sqlite3, esbuild, fsevents, @swc/core

### Community 260 - "boundaries"
Cohesion: 0.50
Nodes (4): hotHook, boundaries, ./app/controllers/**/*.ts, ./app/middleware/*.ts

### Community 261 - "normalizer.ts"
Cohesion: 0.52
Nodes (6): escapeHtmlAttribute(), makeShortName(), normalizeTechnolifeProduct(), sanitizeProductHtml(), slugifyProductTitle(), storageLabel()

### Community 262 - "order.ts"
Cohesion: 0.28
Nodes (6): CategorySpecKey, slugifyKey(), belongsTo, column, dateTime, upsertCategorySpecKeys()

### Community 266 - "queryMarketingSummary"
Cohesion: 0.44
Nodes (8): applyCreatedOverlap(), applyScheduleOverlap(), bucketScheduled(), CountBucket, countRows(), inScheduleRange(), parseBound(), queryMarketingSummary()

### Community 267 - "seller_reconciliation.ts"
Cohesion: 0.46
Nodes (7): applyListFilters(), countRows(), inventoryCountQuery(), ListingQuery, querySellerInventory(), rowStatus(), statusCounts()

### Community 268 - "seller_inventory_query.ts"
Cohesion: 0.33
Nodes (4): SellerOrderItemRow, belongsTo, column, dateTime

### Community 269 - "payment_return_url.ts"
Cohesion: 0.62
Nodes (6): configuredOrigins(), isLoopbackOrigin(), LOOPBACK_HOSTS, normalizeReturnOrigin(), resolvePaymentReturnBase(), zarinpalCallbackUrlWithReturn()

### Community 270 - "category_mapper.ts"
Cohesion: 0.39
Nodes (7): appendSubItem(), ensureCategory(), pickRoot(), resolveCategory(), ResolvedCategory, ROOT_RULES, RootRule

### Community 271 - "seller_categories_query.ts"
Cohesion: 0.52
Nodes (6): applyCategoryFilters(), CategoryQuery, childCountMap(), productCountMap(), querySellerCategories(), statusCounts()

### Community 272 - "seller_promotions_query.ts"
Cohesion: 0.38
Nodes (6): applyCodeFilters(), applyPromoFilters(), CodeQuery, PromoQuery, querySellerContentPromos(), querySellerDiscountCodes()

### Community 273 - "discount_codes_controller.ts"
Cohesion: 0.33
Nodes (5): activeValidator, codeRule, parseDate(), storeValidator, updateValidator

### Community 274 - "footer.ts"
Cohesion: 0.19
Nodes (14): categoryLandingHref(), decodePathSegments(), filterToSearchHref(), findItemInTree(), firstCategoryId(), loadPublicMegaMenuTree(), MegaMenuResolveResult, PublicCategoryRef (+6 more)

### Community 275 - "content_promos_controller.ts"
Cohesion: 0.40
Nodes (4): activeValidator, idRule, storeValidator, updateValidator

### Community 276 - "seller_questions_query.ts"
Cohesion: 0.70
Nodes (4): applyFilters(), querySellerQuestions(), QuestionQuery, statusCounts()

### Community 280 - "seller_mega_menus_controller.ts"
Cohesion: 0.39
Nodes (9): assertCategoryExists(), assertLatinSlug(), categoryRef(), newId(), slugify(), uniqueItemSlug(), uniqueMenuSlug(), uniqueSectionSlug() (+1 more)

### Community 281 - "MegaMenuItem"
Cohesion: 0.20
Nodes (7): MegaMenuItem, MegaMenuItemStatus, MegaMenuItemType, belongsTo, column, dateTime, loadAdminMegaMenuTree()

### Community 282 - "MegaMenuSection"
Cohesion: 0.20
Nodes (6): MegaMenuSection, MegaMenuSectionStatus, belongsTo, column, dateTime, hasMany

### Community 283 - "mega_menu_seeder.ts"
Cohesion: 0.24
Nodes (9): __dirname, loadJson(), run(), seedDir, SeedFile, SeedItem, SeedMenu, SeedSection (+1 more)

### Community 284 - "OrderItemRow"
Cohesion: 0.40
Nodes (4): OrderItemRow, belongsTo, column, dateTime

### Community 285 - "catalog_stock.ts"
Cohesion: 0.43
Nodes (6): asString(), defaultSeoSettings, loadSeoSettings(), normalizeSeoSettings(), saveSeoSettings(), SeoSettingsPayload

### Community 286 - "order.ts"
Cohesion: 0.40
Nodes (4): ORDER_TRANSITIONS, OrderAddress, OrderItem, OrderStatus

### Community 287 - "account_controller.ts"
Cohesion: 0.50
Nodes (3): addressValidator, passwordValidator, profileValidator

### Community 288 - "seller_return.ts"
Cohesion: 0.50
Nodes (3): SELLER_RETURN_TRANSITIONS, SellerReturnItem, SellerReturnStatus

## Knowledge Gaps
- **641 isolated node(s):** `Data`, `User`, `Variants`, `placeholder`, `registry` (+636 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `run()` connect `SellerShop` to `DiscountCode`, `Category`, `seller_reconciliation.ts`, `BlogPost`, `SellerPayout`, `ContentPromo`, `ContentBlock`, `run`, `SellerListing`, `AmazingDeal`, `SellerController`, `ProductQuestion`, `Product`, `SellerReview`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `Product` connect `Product` to `SellerReturn`, `seller_order_detail.ts`, `Category`, `order.ts`, `BlogPost`, `StockMovement`, `media_upload.ts`, `listing_write_service.ts`, `.place`, `seller_questions_query.ts`, `run`, `recommendation_service.ts`, `.run`, `SellerShop`, `StaticPage`, `AmazingDeal`, `SellerController`, `seller_controller.ts`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `Category` connect `Category` to `queryMarketingSummary`, `order.ts`, `BlogPost`, `listing_write_service.ts`, `SellerCustomersController`, `category_mapper.ts`, `ProductAttribute`, `seller_categories_query.ts`, `footer.ts`, `.run`, `SellerShop`, `seller_mega_menus_controller.ts`, `MegaMenuItem`, `mega_menu.spec.ts`, `seller_controller.ts`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `Data`, `User`, `Variants` to the rest of the system?**
  _641 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10505050505050505 - nodes in this community are weakly interconnected._
- **Should `routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._
- **Should `MediaAsset` be split into smaller, more focused modules?**
  _Cohesion score 0.06290471785383904 - nodes in this community are weakly interconnected._