<?php

namespace Database\Seeders;

use App\Models\Stall;
use Illuminate\Database\Seeder;

class StallSeeder extends Seeder
{
    public function run(): void
    {
        $stalls = [
            [
                'id' => 'sarasavi-a',
                'name' => 'Sarasavi Bookshop',
                'hall' => 'Hall A',
                'stall_number' => 'A12 - A18',
                'special_discount' => '20% off with Sampath Credit Cards',
                'category' => 'General & International Fiction, Translations'
            ],
            [
                'id' => 'gunasena-b',
                'name' => 'M.D. Gunasena',
                'hall' => 'Hall B',
                'stall_number' => 'B01 - B10',
                'special_discount' => '15% off with Sampath Debit Cards',
                'category' => 'Children, Sinhala Classics, Educational'
            ],
            [
                'id' => 'vijitha-yapa-a',
                'name' => 'Vijitha Yapa Bookshop',
                'hall' => 'Hall A',
                'stall_number' => 'A01 - A06',
                'special_discount' => 'Up to 25% on selected imports',
                'category' => 'Best-sellers, Non-fiction, History'
            ],
            [
                'id' => 'expographic-c',
                'name' => 'Expographic Books',
                'hall' => 'Hall C',
                'stall_number' => 'C15 - C20',
                'special_discount' => 'Sampath 20% off on Academic & Self-help',
                'category' => 'Academic, Self Development, Sci-Fi'
            ],
            [
                'id' => 'grantha-s',
                'name' => 'Grantha.lk',
                'hall' => 'Sirimavo Hall',
                'stall_number' => 'S05 - S08',
                'special_discount' => 'Buy 2 Get 1 Free offers',
                'category' => 'Sinhala Contemporary, Translations, Graphic Novels'
            ],
            [
                'id' => 'lakehouse-b',
                'name' => 'Lake House Bookshop',
                'hall' => 'Hall B',
                'stall_number' => 'B14 - B18',
                'special_discount' => '15% instant discount on all titles',
                'category' => 'Sri Lankan Heritage, Dictionaries, Literature'
            ],
            [
                'id' => 'godage-d',
                'name' => 'Godage International',
                'hall' => 'Hall D',
                'stall_number' => 'D01 - D08',
                'special_discount' => 'Special fair discounts + Sampath cashback',
                'category' => 'Sinhala Literature, Drama, Poetry, History'
            ],
            [
                'id' => 'samayawardhana-c',
                'name' => 'Samayawardhana Publishers',
                'hall' => 'Hall C',
                'stall_number' => 'C04 - C08',
                'special_discount' => 'Special school discounts',
                'category' => 'Novels, Translations, Religious books'
            ],
            [
                'id' => 'makeen-a',
                'name' => 'Makeen Books',
                'hall' => 'Hall A',
                'stall_number' => 'A22 - A26',
                'special_discount' => '15% off on Young Adult & Manga',
                'category' => 'Manga, Young Adult, Fantasy, Imports'
            ],
            [
                'id' => 'dayawansa-d',
                'name' => 'Dayawansa Jayakody & Co',
                'hall' => 'Hall D',
                'stall_number' => 'D12 - D15',
                'special_discount' => '10% flat discount on all publications',
                'category' => 'Sinhala Fiction, Cultural studies'
            ],
            [
                'id' => 'sadeepa-b',
                'name' => 'Sadeepa Bookshop',
                'hall' => 'Hall B',
                'stall_number' => 'B22 - B25',
                'special_discount' => 'Sampath 15% instant voucher',
                'category' => 'Stationery, Academic & General'
            ],
            [
                'id' => 'jumpbooks-c',
                'name' => 'Jumpbooks.lk',
                'hall' => 'Hall C',
                'stall_number' => 'C30 - C32',
                'special_discount' => 'Special discount bundles for Gen Z & youth',
                'category' => 'Thrillers, Romance, English Paperbacks'
            ],
            [
                'id' => 'jeya-a',
                'name' => 'Jeya Book Centre',
                'hall' => 'Hall A',
                'stall_number' => 'A30 - A34',
                'special_discount' => 'Sampath cardholders 20% discount',
                'category' => 'Medical, Engineering, International paperbacks'
            ],
            [
                'id' => 'masterguide-e',
                'name' => 'Masterguide Publications',
                'hall' => 'Hall E',
                'stall_number' => 'E10 - E14',
                'special_discount' => 'Examination guides special price',
                'category' => 'O/L & A/L Exam Guides, Past Papers'
            ],
            [
                'id' => 'buddhist-cultural-e',
                'name' => 'Buddhist Cultural Centre',
                'hall' => 'Hall E',
                'stall_number' => 'E01 - E04',
                'special_discount' => '15% off on Dhamma publications',
                'category' => 'Philosophy, Buddhism, Meditation'
            ]
        ];

        foreach ($stalls as $stall) {
            Stall::updateOrCreate(['id' => $stall['id']], $stall);
        }
    }
}
