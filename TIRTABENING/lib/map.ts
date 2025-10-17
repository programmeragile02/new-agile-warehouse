export function mapFeatureRow(r: any) {
    // normalizer helper
    const pick = <T = any>(...vals: any[]): T | undefined =>
        vals.find((v) => v !== undefined && v !== null);

    // item type
    const rawType = String(
        pick(r.item_type, r.itemType, r.type, "FEATURE")
    ).toUpperCase();
    const item_type = rawType === "SUBFEATURE" ? "SUBFEATURE" : "FEATURE";

    // module: jangan paksa "General"; biarkan kosong untuk fitur global
    const module_name =
        pick(
            r.module_name,
            r.moduleName,
            r.module,
            r.menu?.module_name,
            r.menu?.moduleName
        ) ?? "";

    // active flag
    const is_active = Boolean(
        pick(r.is_active, r.isActive) ?? (r.deletedAt ? false : true)
    );

    // price & trial
    const price_addon = Number(pick(r.price_addon, r.priceAddon, 0));
    const trial_available = Boolean(
        pick(r.trial_available, r.trialAvailable, false)
    );
    const trial_days = pick(r.trial_days, r.trialDays, null);

    // parent (kirim id & code kalau ada)
    const parent_id =
        pick(r.parent_id, r.parentId) != null
            ? String(pick(r.parent_id, r.parentId))
            : null;
    const parent_code =
        pick(r.parent_code, r.parentCode) != null
            ? String(pick(r.parent_code, r.parentCode))
            : undefined;

    return {
        id: String(pick(r.id, r.feature_id, "")),
        feature_code: String(
            pick(r.feature_code, r.featureCode, r.code, r.slug, "")
        ),
        name: String(pick(r.name, r.title, "")),
        description: pick(r.description) ? String(r.description) : "",
        module_name, // "" => dianggap Global di FE
        item_type, // FEATURE | SUBFEATURE
        parent_id, // boleh null
        parent_code, // optional, kalau ada
        is_active,
        order_number: Number(pick(r.order_number, r.orderNumber, r.sort, 0)),
        price_addon,
        trial_available,
        trial_days: trial_days === null ? null : Number(trial_days),
        created_at: pick(r.created_at, r.createdAt, null),
        updated_at: pick(r.updated_at, r.updatedAt, null),
        product_code: String(
            pick(r.product_code, r.productCode, process.env.PRODUCT_CODE, "")
        ),
    };
}

// mapMenuRow.ts (atau file yang sama)
export function mapMenuRow(r: any) {
    // helper ambil nilai pertama yang ada
    const pick = <T = any>(...vals: any[]): T | undefined =>
        vals.find((v) => v !== undefined && v !== null && v !== "");

    // normalisasi tipe menu
    const rawType = String(pick(r.type, r.menu_type, "menu")).toLowerCase();
    const type = ["group", "module", "menu"].includes(rawType)
        ? rawType
        : "menu";

    // flag aktif: hormati is_active/isActive, atau fallback: jika ada deleted_at dianggap non-aktif
    const is_active =
        (pick(r.is_active, r.isActive) as boolean | undefined) ??
        (pick(r.deleted_at, r.deletedAt) ? false : true);

    // order number dari beberapa kandidat
    const order_number = Number(
        pick(r.order_number, r.orderNumber, r.order, r.sort, r.position, 0)
    );

    // level (root=1). Upstream kadang pakai depth/level/Level
    const level = Number(pick(r.level, r.Level, r.depth, 1));

    // parent id bisa datang sebagai number/bigint/string → kirim string atau null
    const parent_id =
        pick(r.parent_id, r.parentId, r.parentID) != null
            ? String(pick(r.parent_id, r.parentId, r.parentID))
            : null;

    // product_id opsional (UUID). Kembalikan string atau null supaya FE bisa bedakan “tak ada”
    const product_id =
        pick(r.product_id, r.productId) != null
            ? String(pick(r.product_id, r.productId))
            : null;

    return {
        id: String(pick(r.id, r.mirror_id, r.upstream_id, "")), // tetap string
        parent_id,
        level, // <— sekarang ada
        type,
        title: String(pick(r.title, r.name, "Menu")),
        icon: String(pick(r.icon, "")),
        color: pick(r.color) ? String(r.color) : undefined,
        route_path: String(pick(r.route_path, r.routePath, r.path, "")),
        order_number,
        is_active: Boolean(is_active),
        product_code: String(
            pick(r.product_code, r.productCode, process.env.PRODUCT_CODE, "")
        ),
        product_id, // <— sekarang ada
        crud_builder_id:
            pick(r.crud_builder_id, r.crudBuilderId) != null
                ? String(pick(r.crud_builder_id, r.crudBuilderId))
                : undefined,
    };
}

export function productMeta() {
    return {
        product_code: String(process.env.PRODUCT_CODE ?? "NATABANYU"),
        product_name: String(process.env.PRODUCT_NAME ?? "Nata Banyu"),
        description: "Water metering & billing.",
        category: "Utilities",
        status: "Active",
    };
}
