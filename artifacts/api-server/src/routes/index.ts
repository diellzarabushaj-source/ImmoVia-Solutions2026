import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import companiesRouter from "./companies";
import adminRouter from "./admin";
import authRouter from "./auth";
import userAuthRouter from "./user-auth";
import chatRouter from "./chat";
import contactRouter from "./contact";
import storageRouter from "./storage";
import portfolioRouter from "./portfolio";
import publicProfileRouter from "./public-profile";
import billingRouter from "./billing";
import offersRouter from "./offers";
import adminBillingRouter from "./admin-billing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(companiesRouter);
router.use(authRouter);
router.use(userAuthRouter);
router.use(adminRouter);
router.use(chatRouter);
router.use(contactRouter);
router.use(storageRouter);
router.use(portfolioRouter);
router.use(publicProfileRouter);
router.use(billingRouter);
router.use(offersRouter);
router.use(adminBillingRouter);

export default router;
