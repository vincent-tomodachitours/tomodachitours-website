import React from 'react'
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { seoData } from '../data/seoData'

import fushimiInari from "../IMG/Night-Tour/2.webp"
import kiyomizuDera from "../IMG/Gion-Tour/kiyomizu-fall.webp"
import bambooForest from "../IMG/Morning-Tour/bamboo-main-highres1.85.webp"
import kinkakuji from "../IMG/Recommendations/kinkakuji.webp"

import uji from "../IMG/Uji-Tour/byodoin.webp"
import nijoCastle from "../IMG/Recommendations/nijo-castle-gate.webp"
import kifuneShrine from "../IMG/Recommendations/kifune-stairs.webp"
import maruyamaPark from "../IMG/Recommendations/maruyama-blossoms.webp"

import aburiya from "../IMG/Recommendations/aburiya.webp"
import daikiSuisan from "../IMG/Recommendations/daiki-suisan.webp"
import hanatanuki from "../IMG/Recommendations/hanatanuki.webp"
import torikizoku from "../IMG/Recommendations/toriki.webp"

import shareHappiness from "../IMG/Recommendations/sharehappiness.webp"
import rockING from "../IMG/Recommendations/rockingbar.webp"
import escamoteur from "../IMG/Recommendations/l-escamoteur-bar.webp"
import inTheMoon from "../IMG/Recommendations/in-the-moon.webp"

interface RecommendationItem {
    image: string;
    title: string;
    description: string;
    link?: string;
}

interface RecommendationSectionProps {
    title: string;
    items: RecommendationItem[];
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({ title, items }) => (
    <section className='container mx-auto px-4 py-16 max-w-7xl'>
        <div className='text-center mb-12'>
            <h2 className='font-ubuntu text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4'>
                {title}
            </h2>
            <div className='w-24 h-1 bg-blue-500 mx-auto rounded-full'></div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
            {items.map((item, index) => {
                const cardContent = (
                    <>
                        <div className='aspect-[4/3] overflow-hidden'>
                            <img
                                src={item.image}
                                alt={`${item.title} (img)`}
                                className='w-full h-full object-cover transform transition-transform duration-300 hover:scale-110'
                            />
                        </div>
                        <div className='p-6'>
                            <h3 className={`text-xl font-bold mb-3 ${item.link ? 'text-blue-600' : 'text-gray-900'}`}>
                                {item.title}
                            </h3>
                            <p className='text-gray-600'>{item.description}</p>
                        </div>
                    </>
                );

                return item.link ? (
                    <Link
                        key={index}
                        to={item.link}
                        className='bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl block'
                    >
                        {cardContent}
                    </Link>
                ) : (
                    <div key={index} className='bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl'>
                        {cardContent}
                    </div>
                );
            })}
        </div>
    </section>
);

const Recommendations: React.FC = () => {
    const sections = [
        {
            title: "Main Attractions in Kyoto",
            items: [
                {
                    image: fushimiInari,
                    title: "Fushimi-Inari Shrine",
                    description: "Book our night tour of the Fushimi-Inari shrine to escape the crowds and experience the shrine with soft orange lanterns!",
                    link: "/tours/kyoto-fushimi-inari-night-walking-tour"
                },
                {
                    image: kiyomizuDera,
                    title: "Kiyomizu-dera Temple",
                    description: "Book our early morning Gion tour as early as 6:30AM! Learn about Geisha and the rich history of the heart of Kyoto",
                    link: "/tours/kyoto-gion-early-morning-walking-tour"
                },
                {
                    image: bambooForest,
                    title: "Arashiyama Bamboo Forest",
                    description: "Visit the Fushimi-Inari shrine and the Arashiyama area in our early morning tour!",
                    link: "/tours/kyoto-early-bird-english-tour"
                },
                {
                    image: kinkakuji,
                    title: "Golden Pavilion",
                    description: "The temple wrapped in real gold on the outskirts of Kyoto is a spot you cannot miss while visiting Kyoto!"
                }
            ]
        },
        {
            title: "Other Attractions",
            items: [
                {
                    image: uji,
                    title: "Uji - The City of Matcha",
                    description: "Book our tour to the Matcha city where you can grind your own Matcha powder from fresh leaves and enjoy the best Matcha ice cream you've ever had!",
                    link: "/tours/matcha-grinding-experience-and-walking-tour-in-uji-kyoto"
                },
                {
                    image: nijoCastle,
                    title: "Nijo Castle",
                    description: "Visit Nijo Castle in Kyoto, a historic site with beautiful buildings, peaceful gardens, and special 'singing' floors that make sounds when you walk."
                },
                {
                    image: kifuneShrine,
                    title: "Kifune Shrine",
                    description: "A beautiful shrine in the mountains, completely surrounded by nature. If you want to get out of the city for half a day for a quick hike this place is for you!"
                },
                {
                    image: maruyamaPark,
                    title: "Maruyama Park",
                    description: "Maruyama Park in Gion is the perfect place to enjoy the cherry blossoms with the park having an impressive 680 cherry blossom trees!"
                }
            ]
        },
        {
            title: "Restaurants",
            items: [
                {
                    image: aburiya,
                    title: "Aburiya",
                    description: "An all you can eat Japanese BBQ place in the Gion area where you can enjoy high quality beef along with all you can drink!"
                },
                {
                    image: daikiSuisan,
                    title: "Daiki Suisan",
                    description: "A conveyor belt sushi chain where you can enjoy fresh and high quality sushi without completely braking your wallet!"
                },
                {
                    image: hanatanuki,
                    title: "Hanatanuki",
                    description: "Okonomiyaki near Kyoto station where you can order drinks and other sides and have a good time with friends or family"
                },
                {
                    image: torikizoku,
                    title: "Torikizoku",
                    description: "A high quality Yakitori chain where you can drink with friends while enjoying many sides to go with your drink in the store's vibrant atmosphere"
                }
            ]
        },
        {
            title: "Kyoto Bars",
            items: [
                {
                    image: shareHappiness,
                    title: "Share Happiness",
                    description: "A fun Karaoke bar in Pontocho where you can sing with strangers and enjoy a friendly conversation with the owner!"
                },
                {
                    image: rockING,
                    title: "Rocking Bar ING",
                    description: "A hidden dive bar in Pontocho, the super friendly owner plays rock music while you play jenga and drink!"
                },
                {
                    image: escamoteur,
                    title: "L'Escamoteur Bar",
                    description: "A popular bar with vintage cocktails, old-time atmosphere, magic house, elixirs and mystery"
                },
                {
                    image: inTheMoon,
                    title: "In the Moon",
                    description: "A rooftop bar where you can overlook Kyoto and the Kamo river while enjoying drinks in a relaxed atmosphere with stunning city views!"
                }
            ]
        }
    ];

    return (
        <div className='min-h-screen flex flex-col bg-gradient-to-b from-white to-stone-100'>
            <SEO
                title={seoData.recommendations.title}
                description={seoData.recommendations.description}
                keywords={seoData.recommendations.keywords}
            />
            <Header />

            <main className='flex-grow'>
                {sections.map((section, index) => (
                    <RecommendationSection
                        key={index}
                        title={section.title}
                        items={section.items}
                    />
                ))}
            </main>

            <Footer />
        </div>
    )
}

export default Recommendations