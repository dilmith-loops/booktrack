<?php

namespace Database\Seeders;

use App\Models\Spot;
use Illuminate\Database\Seeder;

class SpotSeeder extends Seeder
{
    public function run(): void
    {
        $now = (int) round(microtime(true) * 1000);

        $spots = [
            [
                'id' => 'req-2',
                'post_type' => 'request',
                'book_name' => 'Madol Doova (English Translation)',
                'author' => 'Martin Wickramasinghe',
                'stall_id' => 'seeking',
                'stall_name' => 'BMICH Fairgrounds',
                'hall' => 'Seeking in All Halls',
                'stall_number' => 'Not located yet',
                'images' => [],
                'finder_name' => 'Nipuni Perera',
                'finder_handle' => '@nipuni_reads',
                'timestamp' => $now - (5 * 60 * 1000),
                'notes' => 'Looking for the English translation for a foreign friend visiting BMICH! Has anyone seen it?',
                'status' => 'Looking for Book',
                'helpful_count' => 3,
                'rating_average' => 5.0,
                'rating_count' => 1,
                'ai_verified' => true,
                'is_resolved' => false
            ],
            [
                'id' => 'spot-hp-reply',
                'post_type' => 'spot',
                'book_name' => 'Harry Potter and the Order of the Phoenix',
                'author' => 'J.K. Rowling',
                'stall_id' => 'vijitha-yapa-a',
                'stall_name' => 'Vijitha Yapa Bookshop',
                'hall' => 'Hall A',
                'stall_number' => 'A18 - A24',
                'images' => [
                    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
                ],
                'finder_name' => 'Tanya Perera',
                'finder_handle' => '@tanya_pages',
                'timestamp' => $now - (10 * 60 * 1000),
                'reply_to_request_id' => 'req-1',
                'tagged_requester_name' => 'Kavindu Senanayake',
                'tagged_requester_handle' => '@kavindu_s',
                'price_or_offer' => 'Rs. 3,200 (15% off with Sampath Card)',
                'shelf_location_note' => 'Found on Aisle 3 fiction shelf! 4 copies left near cashier counter.',
                'status' => 'Few Copies Left',
                'helpful_count' => 28,
                'rating_average' => 4.9,
                'rating_count' => 24,
                'ai_verified' => true,
                'sampath_card_discount' => '15% instant discount with Sampath Card',
                'is_resolved' => false
            ],
            [
                'id' => 'req-1',
                'post_type' => 'request',
                'book_name' => 'Harry Potter - Order of the Phoenix',
                'author' => 'J.K. Rowling',
                'stall_id' => 'seeking',
                'stall_name' => 'BMICH Fairgrounds',
                'hall' => 'Hall A',
                'stall_number' => 'Found by @tanya_pages',
                'images' => [],
                'finder_name' => 'Kavindu Senanayake',
                'finder_handle' => '@kavindu_s',
                'timestamp' => $now - (18 * 60 * 1000),
                'notes' => 'Looking for Bloomsbury paperback edition with the blue cover.',
                'status' => 'Found',
                'helpful_count' => 8,
                'rating_average' => 5.0,
                'rating_count' => 1,
                'ai_verified' => true,
                'is_resolved' => true,
                'resolved_by_spot_id' => 'spot-hp-reply'
            ],
            [
                'id' => 'spot-1',
                'post_type' => 'spot',
                'book_name' => 'Atomic Habits by James Clear',
                'author' => 'James Clear',
                'stall_id' => 'expographic-c',
                'stall_name' => 'Expographic Books',
                'hall' => 'Hall C',
                'stall_number' => 'C15 - C20',
                'images' => [
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80'
                ],
                'finder_name' => 'Nethmi & Dilshan',
                'finder_handle' => '@bookspotted_lk',
                'timestamp' => $now - (25 * 60 * 1000),
                'price_or_offer' => 'Rs. 2,400 (Rs. 1,920 with Sampath Card)',
                'shelf_location_note' => 'Front counter display on shelf 2, next to psychology aisle. Stacks available!',
                'status' => 'In Stock',
                'helpful_count' => 38,
                'rating_average' => 4.8,
                'rating_count' => 31,
                'ai_verified' => true,
                'sampath_card_discount' => '20% off with Sampath Card',
                'is_resolved' => false
            ],
            [
                'id' => 'spot-2',
                'post_type' => 'spot',
                'book_name' => 'Madol Doova (මඩොල් දූව) by Martin Wickramasinghe',
                'author' => 'Martin Wickramasinghe',
                'stall_id' => 'gunasena-b',
                'stall_name' => 'M.D. Gunasena',
                'hall' => 'Hall B',
                'stall_number' => 'B01 - B10',
                'images' => [
                    'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'
                ],
                'finder_name' => 'Kasun Bandara',
                'finder_handle' => '@kasun_reads',
                'timestamp' => $now - (40 * 60 * 1000),
                'price_or_offer' => 'Rs. 650 hardcover edition',
                'shelf_location_note' => 'Right side entrance, Sri Lankan classics wooden shelf row 3.',
                'status' => 'In Stock',
                'helpful_count' => 24,
                'rating_average' => 5.0,
                'rating_count' => 19,
                'ai_verified' => true,
                'sampath_card_discount' => '15% instant debit card discount',
                'is_resolved' => false
            ],
            [
                'id' => 'spot-3',
                'post_type' => 'spot',
                'book_name' => 'The Midnight Library by Matt Haig',
                'author' => 'Matt Haig',
                'stall_id' => 'vijitha-yapa-a',
                'stall_name' => 'Vijitha Yapa Bookshop',
                'hall' => 'Hall A',
                'stall_number' => 'A01 - A06',
                'images' => [
                    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1507842229451-9f232615e324?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80'
                ],
                'finder_name' => 'Tanya Perera',
                'finder_handle' => '@tanya_pages',
                'timestamp' => $now - (50 * 60 * 1000),
                'price_or_offer' => 'Rs. 2,150 (Special festival price)',
                'shelf_location_note' => 'Middle table bento showcase under International Fiction banner.',
                'status' => 'Few Copies Left',
                'helpful_count' => 19,
                'rating_average' => 5.0,
                'rating_count' => 1,
                'ai_verified' => true,
                'sampath_card_discount' => 'Up to 25% off on selected titles',
                'is_resolved' => false
            ],
            [
                'id' => 'spot-4',
                'post_type' => 'spot',
                'book_name' => 'Gamperaliya (ගම්පෙරළිය) by Martin Wickramasinghe',
                'author' => 'Martin Wickramasinghe',
                'stall_id' => 'godage-d',
                'stall_name' => 'Godage International',
                'hall' => 'Hall D',
                'stall_number' => 'D01 - D08',
                'images' => [
                    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=800&q=80'
                ],
                'finder_name' => 'Akeel Mohamed',
                'finder_handle' => '@akeel_lit',
                'timestamp' => $now - (95 * 60 * 1000),
                'price_or_offer' => 'Rs. 850 with commemorative bookmark',
                'shelf_location_note' => 'Hall D center aisle, shelf D4 marked "Sahithya Sooriyo".',
                'status' => 'In Stock',
                'helpful_count' => 15,
                'rating_average' => 5.0,
                'rating_count' => 1,
                'ai_verified' => true,
                'sampath_card_discount' => 'Sampath Bank reward points eligible',
                'is_resolved' => false
            ],
            [
                'id' => 'spot-5',
                'post_type' => 'spot',
                'book_name' => 'Atomic Habits by James Clear',
                'author' => 'James Clear',
                'stall_id' => 'sarasavi-a',
                'stall_name' => 'Sarasavi Bookshop',
                'hall' => 'Hall A',
                'stall_number' => 'A12 - A18',
                'images' => [
                    'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80'
                ],
                'finder_name' => 'Dinithi Senanayake',
                'finder_handle' => '@dini_reads',
                'timestamp' => $now - (140 * 60 * 1000),
                'price_or_offer' => 'Rs. 2,350 (20% off with Sampath Card)',
                'shelf_location_note' => 'Section A14 right next to the new arrivals revolving tower.',
                'status' => 'In Stock',
                'helpful_count' => 42,
                'rating_average' => 5.0,
                'rating_count' => 1,
                'ai_verified' => true,
                'sampath_card_discount' => '20% off with Sampath Card',
                'is_resolved' => false
            ]
        ];

        foreach ($spots as $spot) {
            Spot::updateOrCreate(['id' => $spot['id']], $spot);
        }
    }
}
