# Walkthrough: Swiggy Instamart-style Restructured Mobile Sheet, Admin Sizing Sync & Zero-Scroll Layout

## What's New

### 🚀 Performance & Loading State Overhaul
- **Universal Skeleton Shimmer**: Implemented a global `.skeleton-shimmer` CSS class with a sweeping left-to-right `#E8E8E8`/`#F5F5F5` gradient animation (1.2s loop) to replace the static pulsing opacity skeleton.
- **Card-Level Loading Skeletons**: Eliminated the jarring "Curating items from the vault..." full-page loading screen across `/collections`, `/suits`, and `/jewellery`. It has been replaced by a responsive grid of 8 `SkeletonCard` components that perfectly match the aspect ratio and dimension of real product cards.
- **Sitewide Image Lazy Loading**: Reconfigured the `<ImageWithSkeleton>` component to default to `loading="lazy"` sitewide. Added an `eager` prop to bypass lazy-loading for above-the-fold items (the first two items in any grid) to boost LCP (Largest Contentful Paint) scores.
- **Zero Layout Shift Homepage (Reimplemented)**: Refactored the homepage data fetching to use the unified API route (`/api/homepage`). While pending, the homepage strictly renders 3 squarish `.skeleton-pulse` cards (with a `#F6DDE2` base) for the Flash Sale slot (horizontal scroll) and 2 tall full-bleed skeleton cards for the Signature Collections slot. The default state expects `flash_sale_enabled` to be true on first load. Once resolved, if enabled, they populate seamlessly; if disabled, the flash sale slot collapses automatically.

## Previous Fixes

*   **Smaller Thumbnails**: Scaled down the product image thumbnails from `80px` to `60px`.
*   **Condensed Typography**: Shrunk all text sizing inside the cart items. Product titles are now `0.85rem`, variant text is `0.65rem`, and prices are `0.8rem`.
*   **Smaller Quantity Controllers**: Reduced the height and width of the quantity increment/decrement block to `24px`. This makes each cart item significantly shorter vertically, allowing far more items to be visible simultaneously without needing to scroll.

### 2. Cart Drawer Footer Styling ([globals.css](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/globals.css))
*   **Brand Color Background**: Changed the `background-color` of `.cart-drawer-footer` from the generic ivory `#FBF0EC` to the exact pastel pink brand color (`#F6DDE2 !important`).
*   **Black Text Contrast**: Enforced a solid black (`#000000 !important`) text color for the `Taxes and shipping calculated at checkout` subtext note to maintain strong contrast against the new pink background.

### 3. Mobile Full-Screen Cart Drawer & Circular Chevron Dismiss ([Header.js](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/components/Header.js) & [globals.css](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/globals.css))
*   **Forced Full-Screen Overlay**: Set absolute styling on `.cart-drawer-backdrop` and `.cart-drawer` on mobile viewports using `position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 9999 !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important;`. This forces the cart drawer to span the entire mobile screen, covering the announcement bar and leaving no gaps.
*   **Circular Chevron Back Button**: Updated the back button inside the cart drawer header to render as a circular white button with a grey downward chevron (`∨`) icon inside it. Configured `.cart-drawer-back-btn` inside the mobile media query in `globals.css` with `background-color: rgba(255, 255, 255, 0.85) !important; border-radius: 50% !important; width: 36px !important; height: 36px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;` to match the detailed card dismiss button style.
*   **Header Title Alignment**: Styled `.cart-drawer-title` on mobile to position it on the right side of the header using `margin-left: auto !important; text-align: right !important;`.

### 4. Cart Item Image Loading Fix ([Header.js](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/components/Header.js) & [StoreContext.js](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/context/StoreContext.js))
*   **Image Property Fallback**: Fixed the thumbnail rendering in `Header.js` to look for both the `images` array (`item.images && item.images[0]`) and the singular `image` property (`item.image`), which stores the first product image path. This fixes broken images for items inside the cart drawer.
*   **Stored Cart Array Enhancement**: Updated `addToCart` in `StoreContext.js` to store `images: product.images` inside the cart item object to ensure full future-proofing.

### 5. Fixed React Component Shorthand Property Bug ([collections/page.js](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/(store)/collections/page.js))
*   **Border Warning**: Resolved a Next.js/React console warning `"Removing a style property during rerender (borderColor) when a conflicting property is set (border) can lead to styling bugs"`.
*   **Solution**: Modified `activeSizeOptStyle` and `activeColorOptStyle` definitions to use the full `border: '1px solid #000000'` syntax rather than just modifying `borderColor`, explicitly matching the syntax used in the unselected states and preventing conflict rendering loops during state changes.

### 6. Homepage-Only Floating WhatsApp Button ([layout.js](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/(store)/layout.js) & [page.js](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/(store)/page.js))
*   **Removed Global Placement**: Removed the WhatsApp floating anchor widget markup from the store layout `src/app/(store)/layout.js`.
*   **Homepage Specific Integration**: Appended the floating WhatsApp anchor button markup inside the home page component `src/app/(store)/page.js`, ensuring it is only loaded and rendered when viewing the homepage.

### 7. Linear Centered Carousel Switcher ([collections/page.js](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/(store)/collections/page.js) & [globals.css](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/globals.css))
*   **Removed Cloning & Loop Wrap-around**: Removed all infinite loop cloning and wrap-around logic entirely. The switcher circles now map directly 1:1 to the products in the active collection.
*   **Left/Right Stopped Bounds**: The first product has nothing to its left, and the last product has nothing to its right. Selecting the first product positions it in the center with empty space to its left, and selecting the last product centers it with empty space to its right.
*   **Viewport Width Centering**: Tracks the screen width (`viewportWidth`) via resize event listeners. Centered the active product circle dynamically in the exact horizontal middle of the viewport using `translateX` math:
    `translateX = (viewportWidth / 2) - 28 - (activeIndex * 68.8)px`
*   **Seamless Slide Transition**: Tapping a circle on the right or left initiates a smooth transform-based translation animation (`transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)`), moving the tapped circle to the exact horizontal center.
*   **Disabled Manual scrolling**: Updated `.mobile-sibling-switcher-row-outer` in `globals.css` with `width: 100vw !important` and `overflow-x: hidden !important`. This disables manual swipe scrolling to keep the layout strictly aligned and centered.

### 8. Extended Full-Screen Blur Backdrop ([globals.css](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/globals.css))
*   **Full-Screen Blur Overlay**: Extended the inner backdrop `.mobile-bottom-sheet-backdrop-inner` to cover the entire screen from `top: 0` to `height: 100%`. This properly blurs and dims the announcement bar and the top half of the header in the background.
*   **Unresponsive Background clicks**: Restructured `.mobile-bottom-sheet-backdrop` to span the entire screen (`top: 0`, `height: 100vh`) with a transparent background. This effectively captures and blocks all click events on the header logo, search icon, menu bar, and navigation tabs while the detailed view is active, making the background fully unresponsive. Clicking anywhere on this backdrop blocks background actions and dismisses the product modal.

### 9. Header Overlap & Custom Backdrop Position ([globals.css](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/globals.css))
*   **Header Overlap Positioning**: Changed the `top` offset of the mobile sheet container wrapper `.mobile-sheet-wrapper-container` to `70px !important`. Since the announcement bar is `32px` and the header navigation bar is `75px` tall, this vertical position sits exactly at the midpoint of the header bar, covering the bottom half.
*   **Switcher Row Spacing**: Increased the `margin-top` of `.mobile-sibling-switcher-row-outer` to `24px !important` (up from `12px`), providing clean, comfortable breathing room between the bottom of the card and the sibling thumbnail circles row.

### 10. Card Sizing Stability & Cart State Persistence ([collections/page.js](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/(store)/collections/page.js) & [globals.css](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/globals.css))
*   **Identical Counter Sizing**: Removed the redundant flex-column wrapper around `.blinkit-count-controller` (lines 787 and 809) when the item is in the cart, making it a direct child of `.detail-action-bottom-bar`. This mirrors the exact DOM structure and alignment of the `ADD` button.
*   **CSS Selector Isolation**: Updated the CSS button rules in `globals.css` to use direct child selectors (`.detail-action-bottom-bar > button` and `.detail-action-bottom-bar > .blinkit-count-controller`). This styles only the top-level ADD button and the top-level quantity counter to the identical `32px` height, preventing any vertical shifts or resizing of the card.
*   **Prevented Modal Auto-closing**: Extracted primitive dependencies (`colParam`, `searchParam`, `categoryParam`) out of the URL parameter synchronization `useEffect` hook. This stops the React state from clearing `activeProduct` and closing the detailed view modal when the cart state updates.

### 11. Root-Level Scroll Locking ([collections/page.js](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/(store)/collections/page.js) & [globals.css](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/globals.css))
*   **Disabled html and body Scroll**: Extended the React scroll locking `useEffect` hooks in `collections/page.js` to apply the `scroll-locked` class to `document.documentElement` (`html`) as well as `document.body`. This guarantees that background window scrolling is fully deactivated.
*   **Scroll Lock styling**: Updated the `.scroll-locked` class in `globals.css` to target both `html.scroll-locked` and `body.scroll-locked`, enforcing `overflow: hidden !important`, `height: 100vh !important`, and `max-height: 100vh !important`.

### 12. Zero-Scroll Layout & Spacing Optimization ([globals.css](file:///c:/Users/varun/OneDrive/Documents/houseofginija/src/app/globals.css))
*   **Bottom Padding Breathing Room**: Changed the bottom padding of the details container `.detail-preview-grid > div:last-child` to exactly `12px` (`padding: 0.8rem 1.2rem 12px 1.2rem !important`). This provides clear and consistent breathing room between the bottom border of the card and the ADD button / quantity controller.
*   **Prevented Padding Clipping**: Increased the details section `max-height` constraint from `35vh` to `40vh`. This ensures the details have plenty of vertical room to lay out naturally, preventing the bottom padding from being clipped by the height limits on small mobile viewports.
*   **Disabled Scrolling**: Changed `overflow-y` to `hidden !important` on the details container. This completely prevents any vertical scrollbars from appearing, forcing a clean, static, non-scrollable card view.
*   **In-Flow Actions Button**: Relocated the `.card-sticky-footer` block inside the bottom details column flow. By replacing the absolute bottom positioning with in-flow rendering (`position: relative`), the ADD button now sits naturally right below the size selector, completely eliminating the large white gap.
*   **Equal, Consistent Spacing**: Configured a consistent vertical grid gap (`gap: 0.5rem !important`) between all details elements (collection label, title, price, description, stock warning, size selector, and actions footer). This provides perfect, comfortable, and equal breathing room so nothing feels cramped or colliding.
*   **Dynamic Height Autoscaling**: Updated the modal container `.detail-container-box` and grid wrapper to use `height: auto` and `max-height: 70vh`. The card now dynamically shrinks to fit only the details content, leaving no large empty gaps anywhere inside or below the card.

---

## Flash Sale Manager & Homepage Row Implementation

We have successfully implemented the Flash Sale features, adding database columns, admin manager panel, conditional homepage slider row, and category feed priority sorting.

### Changes Implemented

1. **Database Schema & Migrations**
   - Added `flash_sale` (BOOLEAN, default `false`) and `flash_sale_price` (DECIMAL) columns to `products` table.
   - Created `settings` table to store global configurations like `flash_sale_enabled` (seeded as `false`).

2. **Backend API Endpoints**
   - Created `/api/admin/settings` endpoint supporting GET (fetch settings) and POST (save/update settings).
   - Updated `/api/admin/products` PUT and POST routes to handle flash sale values, including server-side validation to reject flash sale prices that are greater than or equal to the original product price.
   - Updated client products GET API (`/api/products`) to expose the flash sale fields and return the global `flash_sale_enabled` state to the client storefront.

3. **Admin Flash Sale Manager Page**
   - Implemented a dedicated management page at `/admin/flash-sale`.
   - Admin can globally toggle the flash sale section.
   - Admin can manage products individually: toggle flash sale active/inactive, input discount prices, view calculated discount percentages, and save row changes with instant inline validation feedback.
   - Added a "Flash Sale Manager" tab to the admin sidebar links.

4. **Homepage Flash Sale Row**
   - Implemented a horizontal scrolling row layout on `/` that renders if the flash sale is enabled globally and at least one product has it active.
   - Display responsive product cards (3 visible on desktop, 2 on tablet, and 1.2 swipeable on mobile).
   - Display a pink (`#D98E9B`) discount percentage badge on the top left of each image and a heart wishlist button on the top right.
   - Display bold brand-colored discount price next to strikethrough original price in grey.
   - Added "SHOP ALL FLASH SALE →" button linking to `/collections`.

5. **Category Prioritization & Detail Badges**
   - Integrated custom sorting on `/collections`, `/suits`, and `/jewellery` pages so flash sale items appear at the very top of each category section (e.g. Rings section has flash sale rings rendered first).
   - Added the pink (`#D98E9B`) discount percentage badge on product cards in all collection feeds, and moved the "Out of Stock" badge to the top right to prevent overlaps.
   - Displayed the pink (`#D98E9B`) discount percentage badge on the product detail bottom sheet card and formatted the price display to show discounted and original prices next to each other.
---

## Admin Portal Mobile Optimizations

We have optimized the entire admin portal for responsive viewing on tablets and mobile screen sizes.

### Changes Implemented

1. **Flexible Sidebar Stacking & Layouts**
   - Wrapped the entire admin page structure inside the `.admin-page-root` layout class.
   - On mobile viewports (widths <= 768px), the layout automatically shifts to a vertical column format (`flex-direction: column`).
   - The admin sidebar turns into a header bar at the top, displaying the portal title and a horizontal scrolling row for the 5 navigation tabs. 
   - Hid the sidebar brand footer on mobile screens to preserve vertical space.

2. **Form Layout Stacking**
   - Enforced vertical stacking on all flex form rows (`formRowStyle`) on mobile viewports so inputs don't squash.

3. **Split Grid & Panel Adjustments**
   - Configured split columns (such as the Visits trend chart and Inventory stock alerts cards on the dashboard page) to stack vertically on mobile.
   - Main content padding is adjusted to a comfortable `1.5rem 1rem` on mobile.

---

## Homepage Mobile Spacing & Section Dividers

We have added section dividing lines and optimized section spacing on the mobile storefront homepage.

### Changes Implemented

1. **Divider Lines between Sections**
   - Wrapped all homepage sections in a `.home-section` helper class.
   - Enforced a thin, light divider line (`border-bottom: 1px solid rgba(139, 119, 137, 0.12)`) under each section on mobile viewports.
   - Excluded the last section (`home-reviews-section`) from having a bottom border to prevent line collision with the footer.
   - Deactivated the redundant standalone separator divider div between Collections and Reviews on mobile.

2. **Compressed Vertical Spacing**
   - Compressed the vertical padding on all mobile homepage sections down to exactly `24px` (down from `3.2rem`), creating a cozy and compact page flow without large, empty gaps.
   - Preserved `padding-top: 0` on the Hero section to keep it correctly aligned with the header.

3. **Viewport Fitting Hero & Feature Strip**
   - Injected className `hero-video` and `hero-overlay` to targets inside the React JSX.
   - Restricted the mobile hero video and dark overlay heights to `calc(100svh - 107px - 70px)` so the bottom feature strip stays aligned on the viewport base.
   - Positioned the value prop feature strip (`hero-value-props-bar`) absolutely at `top: calc(100svh - 107px - 70px)` with a locked height of `70px` and compact icon/text constraints (`0.52rem` font size, `16px` icon sizes, and `8px` padding).
   - This formula-driven stacking uses `svh` (Short Viewport Height) units to guarantee the announcement bar, header navigation bar, hero media frame, and feature strip combine to exactly fit the visible screen height across all mobile viewport heights (from iPhone SE up to iPhone 14 Pro Max) with zero scroll clipping, even when browser address/navigation bars are fully expanded.
4. **Hero video blackout restoration**
   - Restored the background gradient overlay (`background: 'linear-gradient(135deg, rgba(28, 22, 28, 0.45) 0%, rgba(28, 22, 28, 0.7) 100%)'`) to the `hero-overlay` container.
   - The user preferred the original dark overlay because the high brightness of the raw video made the white header text difficult to read.
   - Retained the enhanced white text element shadows (`textShadow: '0 2px 15px rgba(0, 0, 0, 0.4)'`) for even better contrast and readability.

5. **Admin Portal Mobile Responsiveness Refinements**
   - **Top Navigation Bar:** Replaced the tall sidebar with a streamlined horizontal top navigation bar under 768px. Condensed the labels to single words (Dashboard, Products, Flash Sale, Orders, Coupons) and drastically compressed their font size to `8px` with tighter letter spacing, ensuring all 5 options fit seamlessly on a single row without horizontal scrolling or any truncation.
   - **Streamlined Header:** Changed "Ginija Portal" and "Management System" into a unified "Admin Portal" title on mobile. Moved the "Store" and "Sign Out" global action buttons directly into the same header row, perfectly aligned to the right, via a flex container. The `+ ADD CREATION` button remains in the main panel header space. 
   - **Column-Selective Tables:** Completely eliminated horizontal scrolling from all tables by setting `table-layout: fixed` and `overflow-x: hidden`. Using `.hide-on-mobile`, the system strictly limits the table to the 3 most essential columns (e.g. Product Details, Price, Actions). The Action column buttons (Edit/Delete) were styled to automatically wrap and stack, allowing the table content to effortlessly fit within the mobile viewport without getting clipped.
   - **Zero Desktop Interference:** All layout structure updates are strictly confined within the `@media (max-width: 768px)` block, leaving the desktop Admin UI completely untouched and pristine.

## Card Title Color Customization & Layout Order Verification

We have updated the card titles and verified the layout order matching all user requirements:

### 1. Card Title Color Customization
- **Product Name Text Color**: Changed the product name text color on the catalog/product cards across the storefront to match the subtitle color `#B97285` (from "THE DESIGNER LABEL" header).
- **Locations Updated**:
  - `collections/page.js` (`cardTitleStyle` color updated to `#B97285`)
  - `suits/page.js` (`cardTitleStyle` color updated to `#B97285`)
  - `jewellery/page.js` (`cardTitleStyle` color updated to `#B97285`)
  - Homepage `page.js` (`flashSaleProductNameStyle` color updated to `#B97285`)
  - Homepage `page.js` (`cardTitleStyle` for Signature Collections updated to `#B97285`)

### 2. Homepage Layout Order & Gap Verification
- **JSX DOM Order**: The Flash Sale section is placed structurally before Signature Collections in the JSX.
- **Dynamic Collapse**: Controlled its space footprint using `display: (flashSaleEnabled && flashProducts.length > 0) ? 'block' : 'none'`.
- **Flow Coordinates (Verified with Puppeteer)**:
  - **Flash Sale Enabled**: `Hero (top: 107, height: 737)` → `Feature Strip (top: 774, height: 70)` → `Flash Sale (top: 844, height: 438)` → `Signature Collections (top: 1281, height: 494)`.
  - **Flash Sale Disabled**: `Hero (top: 107, height: 737)` → `Feature Strip (top: 774, height: 70)` → `Flash Sale (height: 0, display: none)` → `Signature Collections (top: 844, height: 494)`. Signature Collections moves up directly below the Feature Strip with no empty gap.

### 3. Homepage Flash Sale Scroll Locking & Backdrop Customization
- **iOS Safari & Mobile Scroll Lock Fix**: Updated the reactive `useEffect` hook in homepage `page.js` to not only toggle `document.body.style.overflow = 'hidden'` but also add a non-passive `touchmove` event listener to `document` when the modal is active. This reactively blocks all touch-drag events from reaching the background window on iOS Safari and mobile viewports, and cleanly cleanups the listener on close/unmount.
- **Visual Background Preservation (No Blur)**: Replaced the standard backdrop container inside homepage `page.js` with a customized `.homepage-flash-sale-backdrop` styled with `backgroundColor: 'rgba(0, 0, 0, 0.4)'` and no `backdrop-filter` / `WebkitBackdropFilter`. This leaves the page content behind the homepage bottom sheet fully visible and dimmed, but not blurred out, perfectly preserving context.
- **Scope Isolation**: Kept all scroll locking and blur backdrop behaviors on other pages (`/collections`, `/suits`, `/jewellery`) completely untouched and operating exactly as they were.

## Discount Badge, Wishlist Heart, and Card Symmetry Adjustments

We have successfully refined the layouts and styling to achieve perfect alignment and branding consistency:

### 1. Discount Badge Positioning & Color
- **Move to Top-Left**: Moved the discount badge to the top-left corner (`left: '12px'`, `top: '12px'`) on collection page cards.
- **Brand Pink Styling**: Changed the background color of the discount badge on collection page cards to the secondary brand pink `#B97285`.
- **Homepage Badges Synced**: Synced this same color (`#B97285`) to the flash sale section badges on the homepage.
- **Scope Limit**: Left the layout and positioning of everything else (including bottom sheets) completely untouched.

### 2. Wishlist Heart Alignment
- **True Top-Right Alignment**: Repositioned the wishlist heart icon button on homepage flash sale cards to the true top-right corner of the image wrapper (`top: '8px'`, `right: '8px'`), correcting the misalignment.

### 3. Flash Sale Price & Card Symmetry
- **Standardized Price Font**: Removed bold/enlarged overrides (`fontWeight: '700'`, `fontSize` overrides) from the flash sale price and strikethrough price spans on collection cards. Both now inherit from `cardPriceStyle` (`fontSize: '0.9rem'`, `fontWeight: '600'`) for uniform presentation.
- **Price Row Alignment**: Set a fixed `minHeight: '24px'` with flex-alignment (`display: 'flex'`, `alignItems: 'center'`) on the card price row (`cardPriceStyle`) across collections, suits, and jewellery. This enforces perfect card heights regardless of whether a product is on flash sale.

### 4. Wishlist Heart Restoration & Card Symmetry Fix
- **Card Wishlist Heart Button Added**: Added the absolute positioned wishlist heart button (`top: '8px'`, `right: '8px'`, `zIndex: 11`) to the image wrapper on all product cards in `/collections`, `/suits`, and `/jewellery`. It uses the correct theme pink `#B97285` when toggled.
- **Out of Stock Repositioned**: Moved the "Out of Stock" badge to the bottom-right corner (`bottom: '12px'`, `right: '12px'`) of the image wrapper to prevent overlapping with the wishlist heart button in the top-right.
- **Fixed Button Container Height**: Wrapped the direct cart action buttons (`ADD` / `Sold Out` / quantity selector controller) in a fixed-height row wrapper (`height: '44px'`, `display: 'flex'`, `alignItems: 'center'`). This guarantees that both cards retain identical dimensions regardless of whether they show the `ADD` button or the quantity selector controls.
- **Wishlist Heart Precision Styling**: Shrunk the wishlist heart button overall dimensions to `28px` (with `16px` SVG) and nudged coordinates to `top: 2px`, `right: 4px` on all product cards to stay perfectly contained in the top-right corner.
- **Title and Price Color Sync**: Configured the product name anchor links and flash sale price spans to match secondary brand pink `#B97285`. Both flash price and original price inherit normal font properties (size `0.9rem`, weight `600`) to guarantee alignment.
- **Product Name Weight**: Styled product names with `font-weight: 600` for both flash sale and normal products.
- **Identical ADD & Quantity Controller Blocks**: Unified `.blinkit-add-btn` and `.blinkit-count-controller` in `globals.css` with identical attributes (`height: 36px`, `border-radius: 6px`, `border: 1px solid #B97285`, `display: flex`). Combined with `width: 100%` inline, both blocks look identical and take exactly the same footprint in the `44px` card action row, completely eliminating asymmetrical jumps.
- **Homepage Flash Sale Price Sync**: Synchronized the flash sale price and original price on the homepage to `0.9rem` / `600` weight (updating `flashSaleDiscountPriceStyle` and `flashSaleOriginalPriceStyle`) to ensure they exactly match the standard product price scale.
- **Rogue Mobile Font Override Fix**: Discovered and removed aggressive CSS overrides (`.collections-product-card-content span`) in `globals.css` that were forcefully scaling down the flash sale price (which is wrapped in a `span`) to `0.65rem` on mobile layouts, while the standard price remained `0.9rem`. They are now completely perfectly matched.
- **Absolute Flex-Grow Anchoring**: Refactored the `cardContentStyle` wrapper across `/collections`, `/suits`, and `/jewellery` to utilize `flexGrow: 1` and `justifyContent: 'space-between'`. This locks the action button row perfectly to the bottom of the card and guarantees 0px vertical reflow (jumping) regardless of the button state.
- **Badge Bleeding Fix**: Unified the flash sale badge inset position to `top: 8px, left: 8px` across both the global stylesheet (`.flash-sale-badge`) and all collection component files. This perfectly anchors the badge inside the image without its sharp corners bleeding outside the bounds of the image's rounded corners.
- **Homepage Background Scroll Fix**: Reverted to the strict `touchmove` interception method to fully disable background scrolling on mobile iOS devices when the flash sale detailed view is open. Added an exception boundary so internal scrolling inside the bottom sheet remains functional.
