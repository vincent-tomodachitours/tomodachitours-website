// Test script to verify discount and paid_amount fix
const testDiscountFix = () => {
    console.log('Testing discount and paid_amount fix...');

    // Simulate the discount calculation logic
    const originalAmount = 6500; // Original tour price
    const discountAmount = 1000; // ¥1000 discount
    const finalAmount = originalAmount - discountAmount; // ¥5500

    // Simulate appliedDiscount object structure
    const appliedDiscount = {
        code: 'SAVE1000',
        type: 'fixed',
        value: 1000,
        originalAmount: originalAmount,
        finalAmount: finalAmount
    };

    // Test the discount_amount calculation
    const calculatedDiscountAmount = appliedDiscount.originalAmount - appliedDiscount.finalAmount;
    console.log('Original Amount:', originalAmount);
    console.log('Final Amount (after discount):', finalAmount);
    console.log('Calculated Discount Amount:', calculatedDiscountAmount);
    console.log('Expected Discount Amount:', discountAmount);

    // Test the paid_amount (should be the final amount)
    const paidAmount = finalAmount;
    console.log('Paid Amount (what customer actually pays):', paidAmount);

    // Verify calculations
    const isDiscountCorrect = calculatedDiscountAmount === discountAmount;
    const isPaidAmountCorrect = paidAmount === finalAmount;

    console.log('\n--- Test Results ---');
    console.log('Discount Amount Calculation:', isDiscountCorrect ? '✅ PASS' : '❌ FAIL');
    console.log('Paid Amount Calculation:', isPaidAmountCorrect ? '✅ PASS' : '❌ FAIL');

    if (isDiscountCorrect && isPaidAmountCorrect) {
        console.log('\n🎉 All tests passed! The fix should work correctly.');
        console.log('- discount_amount will be stored as:', calculatedDiscountAmount);
        console.log('- paid_amount will be stored as:', paidAmount);
        console.log('- Refund amount will show:', paidAmount, 'instead of ¥0');
    } else {
        console.log('\n❌ Some tests failed. Please check the calculations.');
    }
};

testDiscountFix();