import { subscribeToSocialPresence } from "./socialPresence";

const supabaseState = vi.hoisted(() => ({
  configured: false,
  client: null as null | {
    channel: (name: string, options: unknown) => {
      on: (type: string, filter: unknown, callback: () => void) => unknown;
      subscribe: (callback: (status: string) => void | Promise<void>) => unknown;
      track: (payload: unknown) => Promise<unknown>;
      untrack: () => Promise<unknown>;
      presenceState: <T>() => Record<string, T>;
    };
    removeChannel: (channel: unknown) => unknown;
  },
}));

vi.mock("./supabaseClient", () => ({
  get isSupabaseConfigured() {
    return supabaseState.configured;
  },
  get supabase() {
    return supabaseState.client;
  },
}));

describe("socialPresence", () => {
  beforeEach(() => {
    supabaseState.configured = false;
    supabaseState.client = null;
  });

  it("deve retornar conjunto vazio quando supabase nao estiver configurado", () => {
    const onChange = vi.fn();

    const unsubscribe = subscribeToSocialPresence("user-1", onChange);

    expect(onChange).toHaveBeenCalledWith(new Set());
    unsubscribe();
  });

  it("deve emitir usuarios online ao sincronizar presence", async () => {
    let syncCallback: (() => void) | null = null;
    const on = vi.fn((_: string, __: unknown, callback: () => void) => {
      syncCallback = callback;
      return channel;
    });
    const subscribe = vi.fn(async (callback: (status: string) => void | Promise<void>) => {
      await callback("SUBSCRIBED");
      return channel;
    });
    const track = vi.fn(async () => ({}));
    const untrack = vi.fn(async () => ({}));
    const presenceState = vi.fn(() => ({
      "user-1": [{ user_id: "user-1" }],
      "user-2": [{ user_id: "user-2" }],
    }));
    const channel = {
      on,
      subscribe,
      track,
      untrack,
      presenceState,
    };
    const removeChannel = vi.fn();

    supabaseState.configured = true;
    supabaseState.client = {
      channel: vi.fn(() => channel),
      removeChannel,
    };

    const onChange = vi.fn();
    const unsubscribe = subscribeToSocialPresence("user-1", onChange);

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
        }),
      );
    });

    syncCallback?.();

    expect(onChange).toHaveBeenLastCalledWith(new Set(["user-1", "user-2"]));

    unsubscribe();
    expect(untrack).toHaveBeenCalled();
    expect(removeChannel).toHaveBeenCalledWith(channel);
  });
});
