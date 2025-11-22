import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type Action = "view" | "add" | "edit" | "delete" | "all";

export async function PATCH(req: Request) {
    try {
        const prisma = await db();
        const body = (await req.json()) as {
            roleId: string;
            value: boolean;
            action?: Action; // default: "all"
            permissionIds?: string[]; // opsional; kalau kosong = semua active
            category?: string | null; // opsional filter grouping
            productCode?: string | null; // opsional; default dari ENV
        };

        const {
            roleId,
            value,
            action = "all",
            permissionIds,
            category = undefined,
            productCode = process.env.NEXT_PUBLIC_PRODUCT_CODE!,
        } = body;

        if (!roleId) {
            return NextResponse.json(
                { ok: false, error: "roleId wajib diisi" },
                { status: 400 }
            );
        }

        // Tentukan target permissionIds
        let targetIds: string[] = [];
        if (permissionIds?.length) {
            targetIds = permissionIds;
        } else {
            const perms = await prisma.appPermission.findMany({
                where: {
                    isActive: true,
                    ...(productCode ? { productCode } : {}),
                    ...(category ? { category } : {}),
                },
                select: { id: true },
            });
            targetIds = perms.map((p) => p.id);
        }

        // Upsert massal
        await prisma.$transaction(
            targetIds.map((permissionId) =>
                prisma.rolePermission.upsert({
                    where: { roleId_permissionId: { roleId, permissionId } },
                    create: {
                        roleId,
                        permissionId,
                        canView:
                            action === "all"
                                ? value
                                : action === "view"
                                ? value
                                : false,
                        canAdd:
                            action === "all"
                                ? value
                                : action === "add"
                                ? value
                                : false,
                        canEdit:
                            action === "all"
                                ? value
                                : action === "edit"
                                ? value
                                : false,
                        canDelete:
                            action === "all"
                                ? value
                                : action === "delete"
                                ? value
                                : false,
                    },
                    update: {
                        ...(action === "all"
                            ? {
                                  canView: value,
                                  canAdd: value,
                                  canEdit: value,
                                  canDelete: value,
                              }
                            : action === "view"
                            ? { canView: value }
                            : action === "add"
                            ? { canAdd: value }
                            : action === "edit"
                            ? { canEdit: value }
                            : { canDelete: value }),
                    },
                })
            )
        );

        return NextResponse.json({ ok: true, count: targetIds.length });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}
