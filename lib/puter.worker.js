const PROJECT_PREFIX = 'room_ai_project_';

const jsonError = (status, message, extra = {}) => {
  // Ensure `extra` never silently overwrites the `error` key
  const { error: _ignored, ...safeExtra } = extra;
  return new Response(JSON.stringify({ error: message, ...safeExtra }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

const getUserId = async (userPuter) => {
  try {
    const user = await userPuter.auth.getUser();
    return user?.uuid || null;
  } catch (e) {
    console.error('[getUserId] Failed to resolve user identity:', e?.message || e);
    return null;
  }
};

router.post('/api/projects/save', async ({ request, user }) => {
  try {
    const userPuter = user?.puter;

    if (!userPuter) return jsonError(401, 'Authentication failed');

    const body = await request.json();
    const project = body?.project;

    if (!project?.id || !project?.sourceImage)
      return jsonError(400, 'Project ID and source image are required');

    const payload = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    const userId = await getUserId(userPuter);
    if (!userId) return jsonError(401, 'Authentication failed');

    const key = `${PROJECT_PREFIX}${userId}_${project.id}`;
    await userPuter.kv.set(key, { ...payload, userId });

    return { saved: true, id: project.id, project: payload };
  } catch (e) {
    return jsonError(500, 'Failed to save project', { message: e.message || 'Unknown error' });
  }
});

router.get('/api/projects/list', async ({ user }) => {
  try {
    const userPuter = user?.puter;
    if (!userPuter) return jsonError(401, 'Authentication failed');

    const userId = await getUserId(userPuter);
    if (!userId) return jsonError(401, 'Authentication failed');

    const projects = (await userPuter.kv.list(`${PROJECT_PREFIX}${userId}_`, true) ?? []).map(
      ({ value }) => ({
        ...value,
        // Preserve the saved isPublic value; do not hardcode true
        isPublic: value?.isPublic ?? false,
      })
    );

    return { projects };
  } catch (e) {
    return jsonError(500, 'Failed to list projects', { message: e.message || 'Unknown error' });
  }
});

router.get('/api/projects/get', async ({ request, user }) => {
  try {
    const userPuter = user?.puter;
    if (!userPuter) return jsonError(401, 'Authentication failed');

    const userId = await getUserId(userPuter);
    if (!userId) return jsonError(401, 'Authentication failed');

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return jsonError(400, 'Project ID is required');

    const key = `${PROJECT_PREFIX}${userId}_${id}`;
    const project = await userPuter.kv.get(key);

    if (!project || project.userId !== userId) return jsonError(404, 'Project not found');

    return { project };
  } catch (e) {
    return jsonError(500, 'Failed to get project', { message: e.message || 'Unknown error' });
  }
});

router.post('/api/projects/delete', async ({ request, user }) => {
  try {
    const userPuter = user?.puter;
    if (!userPuter) return jsonError(401, 'Authentication failed');

    const userId = await getUserId(userPuter);
    if (!userId) return jsonError(401, 'Authentication failed');

    const body = await request.json();
    const id = body?.id;

    // Fix #1: validate id before using it as a key
    if (!id) return jsonError(400, 'Project ID is required');

    const key = `${PROJECT_PREFIX}${userId}_${id}`;

    // Fix #2: verify ownership before deleting
    const existing = await userPuter.kv.get(key);
    if (!existing || existing.userId !== userId) return jsonError(404, 'Project not found');

    await userPuter.kv.del(key);

    return { deleted: true, id };
  } catch (e) {
    return jsonError(500, 'Failed to delete project', { message: e.message || 'Unknown error' });
  }
});
