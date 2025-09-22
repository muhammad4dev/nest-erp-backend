import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { TenantContext } from '../../common/context/tenant.context';

@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface {
  async beforeInsert(event: InsertEvent<any>) {
    await this.setTenantSession(event);
  }

  async beforeUpdate(event: UpdateEvent<any>) {
    await this.setTenantSession(event);
  }

  async beforeRemove(event: RemoveEvent<any>) {
    await this.setTenantSession(event);
  }

  private async setTenantSession(
    event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>,
  ) {
    const tenantId = TenantContext.getTenantId();
    const userId = TenantContext.getUserId();

    if (tenantId) {
      await event.queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );
      if (userId) {
        await event.queryRunner.query(
          `SET LOCAL app.current_user_id = '${userId}'`,
        );
      }
    }
  }
}
