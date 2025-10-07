<?php

return [
    'actions' => [
        \App\Builder\Actions\UploadMasterCsv::class,
        \App\Builder\Actions\ExportCsv::class,
        \App\Builder\Actions\RecalculateStats::class,
    ],
];
