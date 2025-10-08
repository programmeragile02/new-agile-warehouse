<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionAddon;
use App\Models\SubscriptionFeatureOverride;
use Illuminate\Http\Request;

class SubscriptionFeaturesController extends Controller
{
    public function show(Request $req, string $instanceId)
    {
        $overrides = SubscriptionFeatureOverride::where('subscription_instance_id',$instanceId)->get()
            ->mapWithKeys(fn($o)=>[$o->feature_code=>['code'=>$o->feature_code,'enabled'=>(bool)$o->enabled,'source'=>$o->source?:'override']]);

        $addons = SubscriptionAddon::where('subscription_instance_id',$instanceId)->get()
            ->mapWithKeys(fn($a)=>[$a->feature_code=>['code'=>$a->feature_code,'enabled'=>true,'source'=>'addon']]);

        $merged = $addons->merge($overrides)->values()->all();
        return response()->json(['instance_id'=>$instanceId,'features'=>$merged,'updated_at'=>now()->toIso8601String()]);
    }
}
