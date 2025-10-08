## setup untuk kirim ke jobs pembuatan atau generate akun dan db

# warehouse
php artisan serve port 9000
php artisan queue:work --queue=provisioning

php artisan vendor:publish --tag=laravel-mail

# agilestore
php artisan serve port 8001
php artisan queue:work --queue=default,provisioning

atau

php artisan queue:work --queue=provisioning,default -v
