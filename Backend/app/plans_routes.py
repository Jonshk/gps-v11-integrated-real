from __future__ import annotations
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[str] = None
    sub: Optional[str] = None
    desc: Optional[str] = None
    features: Optional[list[str]] = None
    featured: Optional[bool] = None
    waMsg: Optional[str] = None
    cta: Optional[str] = None
    active: Optional[bool] = None
    sort_order: Optional[int] = None


def register_plan_routes(app: FastAPI, require_admin_fn) -> None:

    # ── Público — web y APK ───────────────────────────────────────────────

    @app.get("/plans")
    def list_plans_public():
        """Devuelve solo los planes activos — usado por la web pública."""
        from app.plans_repository import get_all_plans
        return get_all_plans(only_active=True)

    # ── Admin ─────────────────────────────────────────────────────────────

    @app.get("/admin/plans", dependencies=[Depends(require_admin_fn)])
    def list_plans_admin():
        """Devuelve todos los planes (activos e inactivos) para el admin."""
        from app.plans_repository import get_all_plans
        return get_all_plans(only_active=False)

    @app.patch("/admin/plans/{plan_id}", dependencies=[Depends(require_admin_fn)])
    def update_plan(plan_id: str, payload: PlanUpdate):
        from app.plans_repository import update_plan as _update
        data = payload.model_dump(exclude_unset=True)
        plan = _update(plan_id, data)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan no encontrado.")
        return plan

    @app.post("/admin/plans/reset", dependencies=[Depends(require_admin_fn)])
    def reset_plans():
        from app.plans_repository import reset_plans as _reset
        return _reset()
