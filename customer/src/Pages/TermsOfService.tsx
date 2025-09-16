import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import SEO from '../components/SEO'
import { seoData } from '../data/seoData'

const TermsOfService: React.FC = () => {
    return (
        <div className='min-h-screen flex flex-col bg-gradient-to-b from-white to-stone-100'>
            <SEO
                title={seoData.termsOfService.title}
                description={seoData.termsOfService.description}
                keywords={seoData.termsOfService.keywords}
            />
            <Header />

            <main className='flex-grow container mx-auto px-4 py-12 max-w-4xl'>
                <div className='space-y-8'>
                    {/* Header Section */}
                    <div className='text-center mb-12'>
                        <h1 className='font-ubuntu text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4'>
                            Terms of Service
                        </h1>
                        <p className='text-lg text-gray-600 mb-6'>
                            PAY.JP Merchant Terms of Service
                        </p>
                        <div className='w-24 h-1 bg-blue-500 mx-auto rounded-full'></div>
                    </div>

                    {/* Main Content */}
                    <div className='bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'>
                        <div className='p-8 md:p-12'>
                            <div className='prose prose-lg max-w-none text-gray-800 leading-relaxed' style={{ lineHeight: '1.8' }}>

                                <div className='text-center mb-8'>
                                    <h2 className='text-2xl font-bold text-gray-900 mb-4'>PAY.JP Merchant Terms of Service</h2>
                                </div>

                                <div className='space-y-6 text-sm md:text-base max-h-screen overflow-y-auto'>
                                    <p>
                                        These PAY.JP Merchant Terms of Service (the "Terms") set forth the matters that merchants must comply with when using the Service (as defined in Article 2, Item 8) provided by PAY Inc. ("Company"), as well as the rights and obligations between the Company and merchants. Those who wish to use the Service as a merchant are requested to read these Terms in their entirety before agreeing to them.
                                    </p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 1: Application</h3>
                                    <div className='space-y-4'>
                                        <p>1. These Terms are intended to define the rights and obligations between the Company and merchants regarding the use of the Service, and shall apply to all relationships between merchants and the Company regarding the use of the Service.</p>
                                        <p>2. Merchants agree in advance that the Company provides only the Service, that the parties to sales contracts (as defined in Article 2, Item 6) concluded using the Service are merchants and purchasers (as defined in Article 2, Item 2), and that the Company bears no responsibility for sales contracts.</p>
                                        <p>3. Merchants shall comply with the contents of the merchant terms of each partner business operator set forth in the attached documents ("Attached Terms"), and shall compensate for all damages incurred by the Company due to violations of the Attached Terms.</p>
                                        <p>4. Rules, regulations, and other provisions related to the Service that the Company posts on its website from time to time shall constitute part of these Terms.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 2: Definitions</h3>
                                    <p>The following terms used in these Terms shall have the meanings set forth in the following items:</p>
                                    <div className='space-y-4 ml-4'>
                                        <p>(1) "Merchant Agreement" means a contract established based on the Attached Terms that define matters related to credit sales concluded between partner business operators and merchants for merchants to conduct credit sales to purchasers.</p>
                                        <p>(2) "Purchaser" means a corporation or individual who purchases products from merchants using the Service.</p>
                                        <p>(3) "Target Sites, etc." means websites, applications, or services operated by merchants that are specified in application forms.</p>
                                        <p>(4) "Intellectual Property Rights" means copyrights, patent rights, utility model rights, trademark rights, design rights, and other intellectual property rights.</p>
                                        <p>(5) "Partner Business Operators" means business operators engaged in providing payment-related functions such as credit card companies and payment processing companies.</p>
                                        <p>(6) "Sales Contract" means a contract related to the sale of products concluded between merchants and purchasers using the Service.</p>
                                        <p>(7) "Product Payment Claims" means claims of merchants against purchasers established based on sales contracts.</p>
                                        <p>(8) "Service" means the service named PAY.JP provided by the Company, the main content of which is providing payment methods related to product payment claims.</p>
                                        <p>(9) "Information" means information on the Service that merchants can use through the Service (including but not limited to purchaser information).</p>
                                        <p>(10) "EMV 3D Secure Service" means an identity verification service included in the Service to prevent unauthorized use through theft of credit card numbers and other information.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 3: Application and Review</h3>
                                    <div className='space-y-4'>
                                        <p>1. Those who wish to become merchants of the Service shall apply through application forms separately determined by the Company (such applicants are referred to as "Merchant Applicants"), and when the Company notifies acceptance of such application, a contract for the use of the Service in accordance with the provisions of these Terms (the "Usage Agreement") shall be established between the Company and the merchant. When applying, Merchant Applicants shall provide information and materials requested by the Company.</p>

                                        <p>2. If information or materials provided by Merchant Applicants to the Company under the previous paragraph are false, the Company may take measures such as refusing payment of the Service Fee (as defined in Article 7, Paragraph 6), confiscation as a penalty, suspension of merchant qualifications, or cancellation of registration, and merchants agree to this in advance.</p>

                                        <p>3. Even after the Usage Agreement is established under Paragraph 1 of this Article, the Company may refuse payment of the Service Fee until the Company's and partner business operators' reviews are completed.</p>

                                        <p>4. Even after the Usage Agreement is established under Paragraph 1 of this Article, if the Company or partner business operators determine that the Merchant Applicant related to the application under Paragraph 1 of this Article is inappropriate as a merchant based on the results of the Company's and partner business operators' reviews, the Company may take measures such as refusing payment of the Service Fee, confiscation as a penalty, suspension of merchant qualifications, cancellation of registration, or termination of the Usage Agreement, and merchants agree to this in advance. In this case, the Company and partner business operators will not disclose the reasons for determining inappropriateness to such Merchant Applicants.</p>

                                        <p>5. Even after the Usage Agreement is established and reviews are completed under Paragraph 1 of this Article, the Company may at any time request merchants to provide procedures, information, and materials that the Company deems necessary for merchants to continue using the Service, and conduct reviews by the Company and partner business operators. The Company may take measures such as refusing payment of the Service Fee, confiscation as a penalty, suspension of merchant qualifications, cancellation of registration, or termination of the Usage Agreement against merchants who do not provide such procedures, information, and materials, and merchants determined inappropriate by the Company or partner business operators based on review results, and merchants agree to this in advance. In this case, the Company and partner business operators will not disclose the reasons for determining inappropriateness to such merchants.</p>

                                        <p>6. Disputes arising between merchants and purchasers or other third parties based on measures under each paragraph of this Article shall be handled and resolved at the merchant's responsibility, and the Company bears no responsibility for such matters.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 4: Password and User ID Management</h3>
                                    <div className='space-y-4'>
                                        <p>1. Merchants shall manage and store passwords and user IDs at their own responsibility and shall not allow third parties to use them, or lend, transfer, change names, buy, or sell them.</p>

                                        <p>2. Merchants shall bear responsibility for damages due to inadequate management of passwords or user IDs, errors in use, or use by third parties, and the Company bears no responsibility.</p>

                                        <p>3. If merchants discover that passwords or user IDs have been stolen or are being used by third parties, they shall immediately notify the Company and follow the Company's instructions.</p>

                                        <p>4. Merchants shall not set passwords that are easily guessed by third parties and shall set passwords that meet conditions separately specified by the Company.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 5: Use of the Service</h3>
                                    <div className='space-y-4'>
                                        <p>1. During the validity period of the Usage Agreement, merchants may use the Service within the scope of the purpose of these Terms and within the scope that does not violate these Terms, in accordance with methods determined by the Company. Merchants shall not sub-license, lend, or otherwise dispose of the Service.</p>

                                        <p>2. Preparation and maintenance of computers, software, and other equipment, communication lines, and other communication environments necessary to receive the provision of the Service shall be performed at the merchant's expense and responsibility.</p>

                                        <p>3. Merchants shall implement security measures at their own expense and responsibility according to their Service usage environment, such as preventing computer virus infections and preventing unauthorized access and information leakage.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 6: Usage Fees</h3>
                                    <p>Merchants shall pay usage fees specified in the fee schedule as consideration for using the Service by the method specified in the following article.</p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 7: Payment</h3>
                                    <div className='space-y-4'>
                                        <p>1. When making payments of the Service Fee to merchants, the Company may make payments after deducting the usage fees from the previous article. Deducted amounts shall be applied to usage fees.</p>

                                        <p>2. When the Company makes payments of the Service Fee or other payments to merchants, the Company shall make payments to accounts specified by merchants and deemed appropriate by the Company as accounts for making payments to merchants ("Designated Accounts") at any of the times specified by merchants:</p>
                                        <div className='ml-4 space-y-2'>
                                            <p>(1) Closing at the end of each month and making payment by the end of the month following the month to which the closing date belongs</p>
                                            <p>(2) Closing on the 15th and end of each month, making payment for the 15th closing by the end of the month to which the closing date belongs, and making payment for the end-of-month closing by the 15th of the month following the month to which the closing date belongs</p>
                                        </div>
                                        <p>However, if the total amount of the Service Fee is less than 10,000 yen, or if payment cannot be made due to reasons not attributable to the Company, the Company may defer payment to merchants to the next time or later. Merchants cannot designate accounts other than those in their own name as Designated Accounts. Payment obligations of the Company to merchants shall be extinguished by making payments to Designated Accounts, and the same applies even if merchants incorrectly specify Designated Accounts. The Company bears no responsibility for damages incurred by merchants due to incorrect specification of Designated Accounts, and merchants shall bear all costs such as transfer reversal fees arising from incorrect specification of Designated Accounts.</p>

                                        <p>3. Notwithstanding the provisions of the previous paragraph, when separately approved by the Company, merchants may choose the time to request payment rather than receiving payment by the deadlines specified in the previous paragraph. In this case, merchants may request payment when they meet conditions separately determined by the Company, and the Company shall make payment by the end of the month following the month to which the date of such payment request belongs.</p>

                                        <p>4. Transfer fees and other costs necessary for payments under the previous two paragraphs and Paragraph 12 of this Article shall be borne by merchants.</p>

                                        <p>5. Notwithstanding the provisions of Paragraphs 2 and 3 of this Article, when sales contracts are expected to lose effect due to cancellation, revocation, invalidity, or other reasons, when chargebacks or other payment refusal or return reasons determined by partner business operators are expected to occur, when the Company reasonably determines that the effectiveness of debt assignment contracts (as defined in Paragraph 6 of this Article) may be lost under the provisions of Paragraph 9 of this Article, or when other reasonable reasons exist for the Company to reserve payments to merchants, the Company may reserve payments to merchants at its discretion until such reasons are resolved, and merchants agree to this in advance. The Company bears no responsibility for damages incurred by merchants due to measures specified in this paragraph.</p>

                                        <p>6. When product payment claims are established based on sales contracts, merchants shall immediately transfer such product payment claims to the Company (the contract related to this transfer is referred to as "Debt Assignment Contract," and the payment the Company makes to merchants based on such contract is referred to as "Service Fee"), and agree to grant the Company authority to transfer such product payment claims to partner business operators and to receive money related to such product payment claims on behalf of merchants.</p>

                                        <p>7. The Company shall transfer the Service Fee to accounts of financial institutions designated by merchants on the dates specified in Paragraphs 2, 3, or 12 of this Article.</p>

                                        <p>8. Credit card merchant fees that merchants should pay to partner business operators shall be paid by the Company to partner business operators using all or part of the Service usage fees that merchants pay to the Company based on Article 6.</p>

                                        <p>9. When sales contracts lose effect due to cancellation, revocation, invalidity, or other reasons (including cases that fall under chargeback reasons determined by partner business operators), or when the Company shows reasonable reasons to merchants, debt assignment contracts shall immediately and retroactively lose effect, and merchants must immediately refund amounts that the Company paid to merchants in relation to such sales contracts. In this case, the Company may deduct such refund amounts from amounts to be paid to merchants at the Company's discretion.</p>

                                        <p>10. When the Company determines that merchants' transactions are fraudulent, such as merchants and purchasers colluding, the Company may take measures such as canceling debt assignment contracts, refusing payments, suspending merchant qualifications, or canceling registration, and merchants agree to this in advance. In this case, merchants cannot receive payments specified in this Article unless they submit materials showing that such transactions are not fraudulent in content approved by the Company. The Company bears no responsibility for damages incurred by merchants due to measures specified in this paragraph.</p>

                                        <p>11. When payments cannot be made by the deadlines specified in this Article due to system troubles or other reasons, the Company shall endeavor to make payments promptly.</p>

                                        <p>12. When one year has passed since deferral began due to the total amount of the Service Fee being less than 10,000 yen as specified in Paragraph 2 of this Article, or when one year has passed since merchants became able to request payment as specified in Paragraph 3 of this Article and the Company notified merchants to make payment requests but no payment requests were made by merchants, the Company shall make payments by transfer to Designated Accounts. If, based on this paragraph, the Company conducts transfer procedures but transfers are not completed normally due to reasons not attributable to the Company, or if the total amount of the Service Fee is less than 1,000 yen, the Company may deem that merchants have waived payment claim rights related to such payments, and merchants' rights to request such payments shall be extinguished.</p>

                                        <p>13. When one year has passed since deferral began due to inability to make payments for reasons not attributable to the Company as specified in Paragraph 2 of this Article, and merchants have not contacted the Company to correct Designated Accounts and payments of the Service Fee are expected to be impossible, the Company may deem that merchants have waived payment claim rights related to such payments, and merchants' rights to request such payments shall be extinguished.</p>

                                        <p>14. When the total amount of the Service Fee is 1,000 yen or more and no payment requests are made by merchants after Usage Agreements with merchants are terminated, the Company shall make payments by transfer to Designated Accounts. If, based on this paragraph, the Company conducts transfer procedures but transfers are not completed normally due to reasons not attributable to the Company, or if the total amount of the Service Fee is less than 1,000 yen, the Company may deem that merchants have waived payment claim rights related to such payments, and merchants' rights to request such payments shall be extinguished.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 8: Comprehensive Agency Authority and Business Outsourcing</h3>
                                    <div className='space-y-4'>
                                        <p>1. Merchants shall grant the Company authority to comprehensively represent merchants in the following matters:</p>
                                        <div className='ml-4 space-y-2'>
                                            <p>(1) Concluding each Merchant Agreement with partner business operators and making agreements incidental thereto</p>
                                            <p>(2) All transactions with partner business operators related to Merchant Agreements</p>
                                            <p>(3) Credit requests or sales authorization requests, and obtaining sales authorization</p>
                                            <p>(4) Matters related to requests for product payments, and cancellation requests for product payment requests</p>
                                            <p>(5) Notifications to partner business operators, review requests, and receipt of notification documents from partner business operators based on Merchant Agreements</p>
                                            <p>(6) Other matters related to transactions with partner business operators</p>
                                        </div>

                                        <p>2. Merchants shall outsource the following business operations to the Company:</p>
                                        <div className='ml-4 space-y-2'>
                                            <p>(1) Business operations related to security measures</p>
                                            <p>(2) Mail-order application reception business operations</p>
                                            <p>(3) Business operations related to the previous paragraph</p>
                                            <p>(4) Purchaser identity verification business operations</p>
                                            <p>(5) Business operations related to cancellation of sales contract applications</p>
                                            <p>(6) Receipt of notification documents from partner business operators to merchants related to Merchant Agreements</p>
                                            <p>(7) All business operations incidental to the above business operations</p>
                                        </div>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 9: EMV 3D Secure Service Usage Conditions</h3>
                                    <div className='space-y-4'>
                                        <p>1. Merchants may use the EMV 3D Secure Service in accordance with the provisions of this Article and the next Article.</p>

                                        <p>2. Merchants shall use the EMV 3D Secure Service with the recognition that there are credit card companies that can use the EMV 3D Secure Service and credit card companies that cannot use it, depending on the credit card company that issued the credit card used by the purchaser.</p>

                                        <p>3. Before implementing the EMV 3D Secure Service, merchants shall clearly indicate that it is for the purpose of identity verification and obtain purchaser consent in appropriate methods and content regarding the provision of purchaser attribute information necessary for the EMV 3D Secure Service to card companies.</p>

                                        <p>4. When the Company receives sales authorization requests from merchants, the Company shall inquire with card companies about the attribute information collected from purchasers under the previous paragraph, and card companies shall verify such attribute information against purchaser information held by the card companies to confirm matching or non-matching, and notify the Company of the facts of matching or non-matching along with credit card sales authorization or non-authorization notifications, and the Company shall notify merchants of this.</p>

                                        <p>5. Merchants shall agree in advance to the following matters:</p>
                                        <div className='ml-4 space-y-2'>
                                            <p>(1) Card companies and the Company do not certify whether such purchasers are legitimate credit card holders based on the facts of matching or non-matching in the previous paragraph.</p>
                                            <p>(2) Even if receiving notification of the facts of matching in the previous paragraph, this does not guarantee legitimate card sales.</p>
                                            <p>(3) Merchants shall decide at their own responsibility whether to provide the EMV 3D Secure Service to purchasers.</p>
                                            <p>(4) Even if merchants receive chargebacks from card companies for credit card usage fees for credit cards handled using the EMV 3D Secure Service, the Company bears no responsibility.</p>
                                        </div>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 10: Disclaimer Regarding EMV 3D Secure Service</h3>
                                    <div className='space-y-4'>
                                        <p>1. Merchants shall use the EMV 3D Secure Service at their own responsibility and expense, and even if disputes arise with purchasers due to the use of the EMV 3D Secure Service, merchants shall resolve such disputes between themselves and such purchasers and shall not cause any trouble to the Company or card companies. However, this shall not apply when such disputes are due to reasons attributable to the Company or card companies.</p>

                                        <p>2. Merchants shall agree in advance without objection that the use of the EMV 3D Secure Service does not impose any restrictions on actions such as return requests for credit card usage fees based on these Terms.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 11: Merchant Obligations</h3>
                                    <div className='space-y-4'>
                                        <p>1. Merchants shall clearly display to purchasers that the parties to sales contracts are merchants and purchasers, and that rights and obligations based on sales contracts arise between merchants and purchasers.</p>

                                        <p>2. When merchants receive inquiries from purchasers, they must respond sincerely to such inquiries.</p>

                                        <p>3. When making sales to purchasers, merchants must comply with the Act on Specified Commercial Transactions, the Installment Sales Act, the Act against Unjustifiable Premiums and Misleading Representations, the Secondhand Goods Business Act, and other related laws and regulations.</p>

                                        <p>4. When sales contracts are established between merchants and purchasers, merchants shall bear the obligation to fulfill such sales contracts, and even if Usage Agreements are terminated after sales contracts are established, merchants shall not be relieved of their obligation to fulfill sales contracts.</p>

                                        <p>5. When disputes arise between merchants and purchasers regarding non-delivery of products, delayed delivery, defects, or other matters, or when disputes arise with third parties regarding intellectual property rights such as copyrights or trademark rights, or personal rights, merchants shall resolve all such disputes at their own responsibility and expense. In addition, when the Company is forced to pay damages or other compensation to purchasers or other third parties, merchants shall pay the full amount to the Company and shall also pay attorney fees and all other expenses required for such resolution to the Company.</p>

                                        <p>6. Regarding disputes between merchants and purchasers or other third parties, the Company may provide information and other assistance related to such disputes to such purchasers or third parties without obtaining merchant consent, and merchants agree to this in advance.</p>

                                        <p>7. Merchants shall construct and maintain reasonable security systems and shall under no circumstances retain credit card numbers and security codes.</p>

                                        <p>8. When the Company determines that there are inappropriate matters in credit sales conducted by merchants, the Company may request merchants to make changes, improvements, cease sales, or take other measures regarding products handled, advertising expressions, credit sales methods, and other matters, and merchants shall bear the obligation to comply with such requests.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 12: Relationship with Partner Business Operators</h3>
                                    <div className='space-y-4'>
                                        <p>1. Merchants shall conclude necessary contracts with partner business operators at their own responsibility to use the Service (including contracts based on terms, conditions, and other provisions determined by partner business operators), and shall bear obligations to comply with such contracts (including but not limited to payment obligations for fees and other charges).</p>

                                        <p>2. Merchants agree in advance that the Company and partner business operators may share information about merchants (including both sharing information held by the Company to partner business operators and sharing information held by partner business operators to the Company), and shall not raise any objections to this.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 13: Use of Information</h3>
                                    <div className='space-y-4'>
                                        <p>1. Information and purchaser information entered on the Service belong solely to the Company.</p>

                                        <p>2. Merchants may use Information only through the Service. The range of Information that merchants can use shall be determined at the Company's sole discretion.</p>

                                        <p>3. Merchants may use Information only for the purpose of selling products to purchasers on Target Sites, etc., and shall not use it for any other purposes.</p>

                                        <p>4. When Usage Agreements are terminated or when requested by the Company, merchants must promptly delete Information from Target Sites, etc. according to the Company's instructions, and must return or dispose of Information as well as all documents and other recording media containing or including Information and all copies thereof to the Company.</p>

                                        <p>5. If merchants violate the provisions of this Article, merchants shall compensate or indemnify the Company for all damages (including attorney fees) and losses incurred by the Company, and the Company may immediately terminate Usage Agreements for the future by notifying merchants.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 14: Reporting Obligations</h3>
                                    <div className='space-y-4'>
                                        <p>1. Merchants must report on matters specified by the Company regarding Service usage status and other matters whenever requested by the Company, using methods specified by the Company.</p>

                                        <p>2. If the content of reports specified in the previous paragraph is untrue or inaccurate, merchants shall compensate or indemnify the Company for all damages (including attorney fees) and losses incurred by the Company, and the Company may immediately terminate Usage Agreements for the future by notifying merchants.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 15: Prohibited Products for Registration</h3>
                                    <p>Merchants shall not sell products designated by the Company as prohibited products for registration, such as dangerous goods, using the Service.</p>
                                    <p>List of prohibited products: <a href="https://help.pay.jp/ja/articles/3438193" className="text-blue-600 underline">https://help.pay.jp/ja/articles/3438193</a></p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 16: Prohibited Acts</h3>
                                    <p>Merchants shall not engage in any of the following acts when using the Service:</p>
                                    <div className='space-y-2 ml-4'>
                                        <p>(1) Using the Service for services that compete with the Company's services</p>
                                        <p>(2) Money laundering or other acts violating laws related to preventing transfer of criminal proceeds</p>
                                        <p>(3) Using the Service for remittance purposes</p>
                                        <p>(4) Using the Service for pyramid schemes, multi-level marketing, etc.</p>
                                        <p>(5) Acts that impede smooth use of cards, such as refusing to handle valid credit cards used by purchasers, demanding direct cash payments, or charging different amounts from cash sales</p>
                                        <p>(6) Acts that infringe on intellectual property rights, portrait rights, privacy rights, honor, or other rights or interests of the Company, purchasers, or other third parties (including acts that directly or indirectly cause such infringement)</p>
                                        <p>(7) Reverse assembling, reverse compiling, reverse engineering the Service, or decoding source codes by other methods</p>
                                        <p>(8) Acts related to criminal activities or acts contrary to public order and morals</p>
                                        <p>(9) Acts violating laws or internal rules of industry organizations to which the Company or merchants belong</p>
                                        <p>(10) Transmitting information containing computer viruses or other harmful computer programs</p>
                                        <p>(11) Falsifying information that can be used in relation to the Service</p>
                                        <p>(12) Transmitting data exceeding certain data capacities determined by the Company in relation to the Service</p>
                                        <p>(13) Acts that may interfere with the Company's provision of the Service</p>
                                        <p>(14) Other acts that the Company determines to be inappropriate</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 17: Service Suspension etc.</h3>
                                    <div className='space-y-4'>
                                        <p>1. The Company may suspend or interrupt all or part of the use of the Service without prior notice to merchants in any of the following cases:</p>
                                        <div className='space-y-2 ml-4'>
                                            <p>(1) When conducting regular or emergency inspection or maintenance work on computer systems related to the Service</p>
                                            <p>(2) When computers, communication lines, etc. stop due to accidents</p>
                                            <p>(3) When the Service cannot be provided due to force majeure such as fire, power outage, natural disasters, etc.</p>
                                            <p>(4) When the Company otherwise determines that suspension or interruption is necessary</p>
                                        </div>

                                        <p>2. The Company may terminate provision of the Service at its own convenience. In this case, the Company shall notify merchants in advance.</p>

                                        <p>3. The Company shall not bear any responsibility for damages incurred by merchants based on measures taken by the Company under this Article.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 18: Information Storage</h3>
                                    <p>Even if the Company has stored information transmitted and received by merchants for a certain period for operational purposes, the Company shall not be obligated to store such information, and the Company may delete such information at any time. The Company shall not bear any responsibility for damages incurred by merchants based on measures taken by the Company under this Article.</p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 19: Precautions Regarding Downloads etc.</h3>
                                    <p>When merchants install data etc. on their computers or other devices by download or other methods at the start of using the Service or during use of the Service, merchants shall take sufficient care to prevent loss or alteration of information held by merchants or failure, damage, etc. of equipment, and the Company shall not bear any responsibility for such damages occurring to merchants.</p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 20: Rights Attribution</h3>
                                    <p>All ownership and intellectual property rights related to the Service and Information belong entirely to the Company or those who grant licenses to the Company, and the license to use the Service and Information based on these Terms does not mean permission to use intellectual property rights of the Company or those who grant licenses to the Company related to the Service and Information that are not specified in these Terms. Merchants shall not engage in acts that may infringe on intellectual property rights of the Company or those who grant licenses to the Company for any reason (including but not limited to reverse assembly, reverse compilation, reverse engineering).</p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 21: Trademarks</h3>
                                    <p>The Company and merchants may mutually use trademarks, logos, etc. owned by the other party in manners approved by the other party.</p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 22: Contract Termination</h3>
                                    <div className='space-y-4'>
                                        <p>1. The Company may temporarily suspend use of the Service for the relevant merchant or terminate Usage Agreements without prior notice or demand if merchants fall under any of the following circumstances:</p>
                                        <div className='space-y-2 ml-4'>
                                            <p>(1) When violating any provision of these Terms or contracts based on terms, conditions, etc. established by partner business operators</p>
                                            <p>(2) When contracts between merchants and partner business operators specified in Article 12, Paragraph 1 are terminated</p>
                                            <p>(3) When there is a request from partner business operators</p>
                                            <p>(4) When it becomes clear that information provided by merchants to the Company contains false facts</p>
                                            <p>(5) When the Company determines that merchants are providing services competing with the Company</p>
                                            <p>(6) When using or attempting to use the Service for purposes or methods that may cause damage to the Company, purchasers, or other third parties</p>
                                            <p>(7) When interfering with provision of the Service regardless of means</p>
                                            <p>(8) When merchants become unable to make payments or become insolvent, or when applications are filed for commencement of bankruptcy procedures, civil rehabilitation procedures, corporate reorganization procedures, special liquidation procedures, or similar procedures</p>
                                            <p>(9) When merchants receive dishonor dispositions for promissory notes or checks they have issued or accepted, or when they receive transaction suspension dispositions from bill clearinghouses or other similar measures</p>
                                            <p>(10) When applications are filed for attachment, provisional attachment, provisional disposition, compulsory execution, or auction</p>
                                            <p>(11) When receiving disposition for tax or public charge delinquency</p>
                                            <p>(12) When there is no use of the Service for 6 months or more and there is no response to contact from the Company</p>
                                            <p>(13) When merchants die or receive judgments for commencement of guardianship, curatorship, or assistance</p>
                                            <p>(14) When the Company determines that merchants are antisocial forces (meaning organized crime groups, organized crime group members, right-wing groups, antisocial forces, and others equivalent to these; the same hereinafter) or are engaged in some form of interaction or involvement with antisocial forces such as cooperating with or being involved in maintaining, operating, or managing antisocial forces through funding or other means</p>
                                            <p>(15) When the Company otherwise determines that merchants are not appropriate as merchants</p>
                                        </div>

                                        <p>2. The Company shall not bear any responsibility for damages incurred by merchants due to actions taken by the Company under this Article.</p>

                                        <p>3. The Company and merchants may terminate Usage Agreements for the future by notifying the other party by methods prescribed by the Company at least 30 days in advance.</p>

                                        <p>4. When Usage Agreements are terminated under this Article, merchants shall return, dispose of, or otherwise handle software, manuals, and other items related to the Service provided by the Company according to the Company's instructions.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 23: Disclaimer and Exemption</h3>
                                    <div className='space-y-4'>
                                        <p>1. The Company makes no warranties whatsoever regarding the Service and Information concerning accuracy, usefulness, legality, absence of defects, security, fitness for particular purposes, non-infringement of rights, or any other matters. Furthermore, the Company shall not be obligated to modify or improve the Service and Information.</p>

                                        <p>2. Merchants shall investigate at their own responsibility and expense whether using the Service and Information violates laws applicable to merchants, internal rules of industry organizations, etc., and the Company makes no warranties whatsoever that merchants' use of the Service and Information complies with laws applicable to merchants, internal rules of industry organizations, etc.</p>

                                        <p>3. Transactions, communications, disputes, etc. arising between merchants and purchasers or other third parties in relation to the Service, Information, or Target Sites shall be handled and resolved at merchants' responsibility, and the Company shall not bear any responsibility for such matters.</p>

                                        <p>4. The Company shall not bear any responsibility for damages incurred by merchants related to interruption, suspension, termination, inability to use, or changes in provision of the Service and Information by the Company, deletion or loss of merchants' messages or information, termination of Usage Agreements, data loss or equipment failure or damage due to use of the Service and Information, or other damages incurred by merchants in relation to the Service and Information.</p>

                                        <p>5. The Company shall not bear any responsibility for damages incurred by merchants due to defects, etc. in services provided by business operators partnering with the Company.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 24: Dispute Resolution, Damages, and Penalties</h3>
                                    <div className='space-y-4'>
                                        <p>1. If merchants cause damage to the Company by violating these Terms or in relation to use of the Service or Information, merchants must compensate the Company for such damages.</p>

                                        <p>2. If merchants receive claims from purchasers, partner business operators, or other third parties related to the Service, Information, or Target Sites, or if disputes arise with such parties, merchants shall immediately notify the Company of the content, handle such claims or disputes at their own expense and responsibility, and report the progress and results to the Company based on requests from the Company.</p>

                                        <p>3. If the Company receives any claims from partner business operators, purchasers, or other third parties due to rights infringement or other reasons related to merchants' use of the Service or Information or use of Information on Target Sites, merchants must compensate amounts that the Company is forced to pay to such third parties based on such claims.</p>

                                        <p>4. The Company shall not bear any responsibility for compensation for damages incurred by merchants related to the Service, Information, or Target Sites. Even if the Company bears damage compensation responsibility to merchants for any reason, the Company's compensation responsibility shall be limited to the total amount of usage fees actually received by the Company in the past month (meaning amounts including consumption tax when consumption tax is incurred).</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 25: Confidentiality</h3>
                                    <div className='space-y-4'>
                                        <p>1. In these Terms, "Confidential Information" means all information related to the Company's technology, sales, business, finance, organization, and other matters that merchants are provided or disclosed by the Company in writing, orally, or through recording media, etc., or that merchants become aware of in relation to Usage Agreements or the Service (including but not limited to personal information about purchasers (meaning personal information as defined in Article 2, Paragraph 1 of the Personal Information Protection Act; the same hereinafter) and other information). Information shall be included in the Company's Confidential Information. However, regarding information other than Information, the following items shall be excluded from Confidential Information, except for personal information:</p>
                                        <div className='space-y-2 ml-4'>
                                            <p>(1) Information that was already publicly known or already known when provided, disclosed, or learned from the Company</p>
                                            <p>(2) Information that became publicly known through publications or other means due to reasons not attributable to merchants after being provided, disclosed, or learned from the Company</p>
                                            <p>(3) Information lawfully obtained from third parties with authority to provide or disclose without being subject to confidentiality obligations</p>
                                            <p>(4) Information developed independently without relying on Confidential Information</p>
                                            <p>(5) Information confirmed in writing by the Company as not requiring confidentiality</p>
                                        </div>

                                        <p>2. Merchants shall use Confidential Information only for the purpose of using the Service and Information based on Usage Agreements and shall not provide, disclose, or leak the Company's Confidential Information to third parties without written consent from the Company.</p>

                                        <p>3. Notwithstanding the provisions of the previous paragraph, merchants may disclose Confidential Information based on orders, requests, or demands from laws, courts, or government agencies. However, when such orders, requests, or demands are made, merchants must promptly notify the Company of such fact.</p>

                                        <p>4. When merchants copy documents or magnetic recording media, etc. containing Confidential Information, they must obtain prior written consent from the Company, and management of copies shall be conducted strictly in accordance with Paragraph 2 of this Article.</p>

                                        <p>5. Merchants must return or dispose of Confidential Information as well as all written and other recording media materials containing or including Confidential Information and all copies thereof according to the Company's instructions without delay whenever requested by the Company.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 26: Personal Information</h3>
                                    <p>The Company shall handle merchants' personal information in accordance with the Company's Privacy Policy, and merchants agree to this in advance.</p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 27: PCI DSS Compliance</h3>
                                    <p>When storing, processing, or transmitting information related to purchasers' credit cards, the Company shall comply with PCI DSS requirements.</p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 28: Validity Period</h3>
                                    <p>Usage Agreements shall commence on the date Usage Agreements are established and shall remain valid between the Company and merchants until the date Usage Agreements are terminated or the date provision of the Service ends.</p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 29: Changes to Terms etc.</h3>
                                    <div className='space-y-4'>
                                        <p>1. The Company may freely change the content of the Service.</p>

                                        <p>2. The Company may change these Terms without prior consent from merchants.</p>

                                        <p>3. Regarding changes to these Terms, when the Company announces on its homepage etc. that these Terms will be changed, the content of changes, and the time when such changes become effective, or notifies merchants of these matters, and when such effective time arrives, merchants shall be deemed to have approved such changes.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 30: Contact/Notification</h3>
                                    <p>Inquiries and other contacts or notifications from merchants to the Company regarding Service use, and notifications and other contacts or notifications from the Company to merchants regarding changes to these Terms, shall be made by methods determined by the Company.</p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 31: Transfer of Terms etc.</h3>
                                    <div className='space-y-4'>
                                        <p>1. Merchants may not transfer, assign, create security interests in, or otherwise dispose of positions under Usage Agreements or rights or obligations based on these Terms to third parties without prior written consent from the Company.</p>

                                        <p>2. When the Company transfers business related to the Service to other companies, the Company may transfer positions under Usage Agreements, rights and obligations based on these Terms, and merchant information and other merchant information to such business transfer recipients, and merchants agree to such transfers in advance under this paragraph. The business transfer defined in this paragraph includes not only ordinary business transfers but also corporate splits and all other cases where business is transferred.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 32: Complete Agreement</h3>
                                    <p>These Terms constitute the complete agreement between the Company and merchants regarding matters included in these Terms and supersede all prior agreements, representations, and understandings between the Company and merchants regarding matters included in these Terms, whether oral or written.</p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 33: Severability</h3>
                                    <p>Even if any provision of these Terms or part thereof is determined to be invalid or unenforceable under the Consumer Contract Act or other laws, the remaining provisions of these Terms and remaining parts of provisions determined to be partially invalid or unenforceable shall continue to have full effect, and the Company and merchants shall endeavor to modify the invalid or unenforceable provisions or parts to the extent necessary to make them legal and enforceable, and to ensure the intent of such invalid or unenforceable provisions or parts and legally and economically equivalent effects.</p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 34: Surviving Provisions</h3>
                                    <p>The provisions of Article 1, Paragraphs 2 and 3; Article 3, Paragraph 6; Article 4, Paragraph 2; Article 5, Paragraphs 2 and 3; Articles 6 and 7; Article 9, Paragraph 3, Item 2 and Paragraph 5, Item 4; Article 10; Article 11, Paragraphs 4 through 7; Article 12; Article 13, Paragraph 1 and Paragraphs 3 through 5; Article 14, Paragraph 2; Article 17, Paragraph 3; Articles 18 through 20; Article 22, Paragraphs 2 and 4; Articles 23 through 26; and Articles 31 through 36 shall remain valid even after termination of Usage Agreements.</p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 35: Governing Law and Jurisdiction</h3>
                                    <p>The governing law for these Terms shall be Japanese law, and for all disputes arising from or related to these Terms, the Tokyo Summary Court or Tokyo District Court shall have exclusive agreed jurisdiction as the court of first instance.</p>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 36: Representations and Warranties Regarding Acts Specified in the Specified Commercial Transactions Act</h3>
                                    <div className='space-y-4'>
                                        <p>1. Merchants represent and warrant that they do not currently or in the future fall under any of the following categories. However, this shall not apply when there is prior permission from the Company or partner business operators:</p>
                                        <div className='ml-4 space-y-2'>
                                            <p>(1) Having received administrative disposition under the Specified Commercial Transactions Act or adverse judgments for violations of the Consumer Contract Act in the past 5 years</p>
                                            <p>(2) Engaging in "door-to-door sales" or "telephone solicitation sales" as defined in Article 2 of the Specified Commercial Transactions Act</p>
                                            <p>(3) Engaging in "multi-level marketing transactions" as defined in Article 33 of the Specified Commercial Transactions Act</p>
                                            <p>(4) Providing "specified continuous services" as defined in Article 41 of the Specified Commercial Transactions Act</p>
                                            <p>(5) Engaging in "business opportunity sales transactions" as defined in Article 51 of the Specified Commercial Transactions Act</p>
                                        </div>

                                        <p>2. If it becomes clear that merchants fall under any of the categories in the previous paragraph or that these representations and warranties are false declarations, merchants shall not object to refusal of Usage Agreement conclusion, temporary suspension of Service use, or termination of Usage Agreements. Even if damages arise from this, merchants shall bear all responsibility and shall not make damage compensation claims, etc. against the Company.</p>

                                        <p>3. For merchants who concluded Usage Agreements before the revision date of May 31, 2018 and fall under categories (1) through (5) of Paragraph 1 of this Article, the Company and such merchants shall consult with each other.</p>
                                    </div>

                                    <h3 className='text-lg font-bold text-gray-900 mt-8 mb-4'>Article 37: Consultation and Resolution</h3>
                                    <p>The Company and merchants shall, when matters not specified in these Terms arise or when doubts arise regarding interpretation of these Terms, seek prompt resolution through consultation in accordance with principles of good faith.</p>

                                    <div className='mt-12 p-6 bg-gray-50 rounded-lg'>
                                        <p className='text-sm text-gray-600 mb-4'>
                                            <strong>Last Revised:</strong> October 1, 2024
                                        </p>
                                        <p className='text-sm text-gray-600 mb-4'>
                                            This is the complete PAY.JP Merchant Terms of Service translated from Japanese to English. These terms govern the use of PAY.JP payment processing services for merchants.
                                        </p>
                                        <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                                            <p className='text-sm text-blue-800 mb-2'>
                                                <strong>Translation Notice:</strong> This document is an English translation of the original Japanese PAY.JP Merchant Terms of Service. In case of any discrepancy between this translation and the original Japanese version, the Japanese version shall prevail.
                                            </p>
                                            <p className='text-sm text-blue-700'>
                                                <strong>Original Japanese Document:</strong> <a href="https://pay.jp/terms/20250507/tos.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">https://pay.jp/terms/20250507/tos.pdf</a>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info Section */}
                    <div className='bg-blue-50 rounded-2xl border border-blue-200 p-8'>
                        <div className='text-center'>
                            <h3 className='text-xl font-semibold text-blue-900 mb-4'>
                                Payment Processing Information
                            </h3>
                            <p className='text-blue-800 mb-6'>
                                Tomodachi Tours uses PAY.JP as our payment processor to ensure secure and reliable transactions for all tour bookings.
                            </p>
                            <div className='flex justify-center gap-4'>
                                <Link
                                    to="/privacy-policy"
                                    className='text-blue-600 hover:text-blue-700 underline font-medium'
                                >
                                    Privacy Policy
                                </Link>
                                <Link
                                    to="/cancellation-policy"
                                    className='text-blue-600 hover:text-blue-700 underline font-medium'
                                >
                                    Cancellation Policy
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default TermsOfService 