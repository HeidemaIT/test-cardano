function makeValidator(schema, pick, errorMessage) {
    return (req, res, next) => {
        const parsed = schema.safeParse(pick(req));
        if (!parsed.success) {
            res.status(400).json({ error: errorMessage, details: parsed.error.flatten() });
            return;
        }
        next();
    };
}
export function validateBody(schema) {
    return makeValidator(schema, (req) => req.body, 'Invalid request body');
}
export function validateQuery(schema) {
    return makeValidator(schema, (req) => req.query, 'Invalid request query');
}
export function validateParams(schema) {
    return makeValidator(schema, (req) => req.params, 'Invalid request params');
}
