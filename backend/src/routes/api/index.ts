import { Hono } from "hono";
import { requireDb } from "../../lib/http.js";
import { productRoutes } from "./products.js";
import { b2bProductRoutes } from "./b2b-products.js";
import { newCollectionRoutes } from "./new-collection.js";
import { welcomeKitRoutes } from "./welcome-kits.js";
import { customerRoutes } from "./customers.js";
import { agentRoutes } from "./agents.js";
import { orderRoutes, sampleOrderRoutes } from "./orders.js";
import { paymentRoutes } from "./payments.js";
import { reviewRoutes } from "./reviews.js";
import { agentVisitRoutes } from "./agent-visits.js";
import { notificationRoutes } from "./notifications.js";
import { settingsRoutes } from "./settings.js";

export const apiRoutes = new Hono();

apiRoutes.use("*", requireDb);

apiRoutes.get("/", (c) =>
  c.json({
    resources: [
      "products",
      "b2b-products",
      "new-collection",
      "welcome-kits",
      "customers",
      "agents",
      "agent-visits",
      "orders",
      "sample-orders",
      "payments",
      "reviews",
      "notifications",
      "settings",
    ],
  }),
);

apiRoutes.route("/products", productRoutes);
apiRoutes.route("/b2b-products", b2bProductRoutes);
apiRoutes.route("/new-collection", newCollectionRoutes);
apiRoutes.route("/welcome-kits", welcomeKitRoutes);
apiRoutes.route("/customers", customerRoutes);
apiRoutes.route("/agents", agentRoutes);
apiRoutes.route("/agent-visits", agentVisitRoutes);
apiRoutes.route("/orders", orderRoutes);
apiRoutes.route("/sample-orders", sampleOrderRoutes);
apiRoutes.route("/payments", paymentRoutes);
apiRoutes.route("/reviews", reviewRoutes);
apiRoutes.route("/notifications", notificationRoutes);
apiRoutes.route("/settings", settingsRoutes);
