import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import companiesRouter from "./companies";
import adminRouter from "./admin";
import authRouter from "./auth";
import chatRouter from "./chat";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(companiesRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(chatRouter);
router.use(contactRouter);

export default router;
