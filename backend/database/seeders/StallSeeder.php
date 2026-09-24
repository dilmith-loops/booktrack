<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class StallSeeder extends Seeder
{
    public function run(): void
    {
        if (\App\Models\Stall::count() > 0) {
            return;
        }

        $csvPath = public_path('cibf_2026_stalls.csv');
        if (!file_exists($csvPath)) {
            $csvPath = base_path('../public/cibf_2026_stalls.csv');
        }

        if (!file_exists($csvPath)) {
            return;
        }

        $content = file_get_contents($csvPath);
        $lines = explode("\n", str_replace(["\r\n", "\r"], "\n", $content));
        $grouped = [];

        foreach ($lines as $idx => $line) {
            if ($idx === 0 || trim($line) === '') continue;
            $parts = str_getcsv($line);
            if (count($parts) < 2) continue;
            $code = trim($parts[0]);
            $name = trim($parts[1]);
            if ($code === '' || $name === '') continue;

            $prefix = strtoupper($code[0]);
            $key = strtoupper($name) . '__' . $prefix;
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'name' => ucwords(strtolower($name)),
                    'hall' => 'Hall ' . $prefix,
                    'booths' => []
                ];
            }
            $grouped[$key]['booths'][] = $code;
        }

        foreach ($grouped as $item) {
            $booths = $item['booths'];
            sort($booths, SORT_NATURAL);
            $stallNumber = count($booths) > 1 ? $booths[0] . ' - ' . end($booths) : $booths[0];
            $slug = \Illuminate\Support\Str::slug($item['name'], '-');
            $id = 'stall-' . $slug . '-' . \Illuminate\Support\Str::slug($item['hall'], '-');

            \App\Models\Stall::updateOrCreate(
                ['id' => $id],
                [
                    'name' => $item['name'],
                    'hall' => $item['hall'],
                    'stall_number' => $stallNumber,
                    'category' => 'General Books & Fiction',
                    'is_hidden' => false,
                ]
            );
        }
    }
}
