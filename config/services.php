<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'panel' => [
        'base' => env('PANEL_BASE', 'http://localhost:8000/api'),
        // jika suatu hari perlu auth service-to-service, tambahkan key di sini
        'key'  => env('PANEL_SERVICE_KEY', ''),
    ],

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | AppGenerate (Downstream Service)
    |--------------------------------------------------------------------------
    */
    'appgenerate' => [
        'base' => env('APPGENERATE_BASE', 'http://localhost:9001/api'),
        'key'  => env('WAREHOUSE_API_KEY', ''),
    ],

    'store_webhook' => [
        'secret' => env('STORE_WEBHOOK_SECRET', ''),
    ],

    
    'warehouse' => [
    'base'       => env('WAREHOUSE_BASE', 'http://localhost:9000/api'),
    'client_key' => env('WAREHOUSE_CLIENT_KEY', ''), // akan dikirim sebagai X-CLIENT-KEY
],

];
