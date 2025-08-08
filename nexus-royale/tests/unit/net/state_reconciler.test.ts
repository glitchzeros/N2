import { StateReconciler } from '@/engine/net/sync/StateReconciler';

describe('StateReconciler', () => {
  test('acknowledge stores highest tick', () => {
    const r = new StateReconciler();
    r.acknowledge(3);
    r.acknowledge(1);
    expect(r.getLastAck()).toBe(3);
  });

  test('reconcile replaces comps when server tick <= predicted', () => {
    const r = new StateReconciler();
    const predicted = { tick: 10, entities: new Map([[1, { x: 0 }]]) };
    const server = { tick: 10, entities: new Map([[1, { x: 5 }]]) };
    const out = r.reconcile(predicted, server);
    expect(out.entities.get(1)).toEqual({ x: 5 });
    expect(out.tick).toBe(10);
  });

  test('reconcile adopts server when server ahead', () => {
    const r = new StateReconciler();
    const predicted = { tick: 5, entities: new Map([[1, { x: 0 }]]) };
    const server = { tick: 6, entities: new Map([[1, { x: 9 }]]) };
    const out = r.reconcile(predicted, server);
    expect(out.tick).toBe(6);
    expect(out.entities.get(1)).toEqual({ x: 9 });
  });
});