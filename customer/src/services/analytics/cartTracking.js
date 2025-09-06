// Cart and abandonment tracking functionality

const CART_ABANDONMENT_KEY = 'cart_abandonment_data';

// Cart data management for abandonment tracking
export const storeCartData = (tourData) => {
    try {
        const cartData = getCartData();
        const existingIndex = cartData.findIndex(item => item.tourId === tourData.tourId);

        if (existingIndex >= 0) {
            cartData[existingIndex] = { ...tourData, updated_at: Date.now() };
        } else {
            cartData.push({ ...tourData, added_at: Date.now() });
        }

        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('cart_data', JSON.stringify(cartData));
        }
    } catch (error) {
        console.warn('Error storing cart data:', error);
    }
};

export const getCartData = () => {
    try {
        if (typeof sessionStorage === 'undefined') return [];

        const cartData = sessionStorage.getItem('cart_data');
        return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
        console.warn('Error retrieving cart data:', error);
        return [];
    }
};

export const getTimeInCart = () => {
    const cartData = getCartData();
    if (cartData.length === 0) return 0;

    const oldestItem = cartData.reduce((oldest, item) => {
        const itemTime = item.added_at || Date.now();
        return itemTime < oldest ? itemTime : oldest;
    }, Date.now());

    return Math.round((Date.now() - oldestItem) / 1000); // Return seconds
};

// Abandonment data storage
export const storeAbandonmentData = (abandonmentType, data, stage = null) => {
    try {
        const abandonmentData = {
            type: abandonmentType,
            data: data,
            stage: stage,
            timestamp: Date.now()
        };

        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(CART_ABANDONMENT_KEY, JSON.stringify(abandonmentData));
        }
    } catch (error) {
        console.warn('Error storing abandonment data:', error);
    }
};

// Checkout step mapping
export const getCheckoutStep = (checkoutStage) => {
    const checkoutSteps = {
        'tour_selection': 1,
        'date_selection': 2,
        'customer_info': 3,
        'payment_info': 4,
        'payment_processing': 5
    };
    return checkoutSteps[checkoutStage] || 0;
};

// Clear cart data after successful purchase
export const clearCartData = () => {
    try {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('cart_data');
            sessionStorage.removeItem(CART_ABANDONMENT_KEY);
        }
    } catch (error) {
        console.warn('Error clearing cart data after purchase:', error);
    }
};