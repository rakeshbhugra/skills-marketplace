
# Infrastructure as Code (CDK / Terraform)

← [Back to index](./README.md)

Once an app needs RDS, ElastiCache, an SQS queue, and a load balancer in front of Fargate, *someone has to create all that.* Doing it by clicking in the AWS console works exactly once — until you need a staging copy, or someone changes a setting nobody can find again. This doc is the orientation: what IaC buys you, CDK vs. Terraform, and — most importantly — when *not* to reach for it.

> **Companion doc:** [Containerization](./containerization.md) defines the *image* and which managed services it talks to. IaC is how those managed services get *created*. Your IaC stack is, almost line for line, the list of [adapters](./adapter.md) your app has.

## The goal (the only one)

> **Anyone on the team should be able to create a complete, identical environment from a clean account with one command — and tear it down with another.**

That's the test. If standing up staging means a half-day of console clicking and a Confluence page of "don't forget to also…", you don't have infrastructure — you have folklore. IaC turns that folklore into a reviewable, version-controlled, reproducible artifact. The payoff isn't "fancy"; it's that environments stop being snowflakes.

## What "ClickOps" costs you (the trap)

Provisioning by hand in the console is the default, and it quietly costs you four things:

1. **No reproducibility.** Staging and prod drift apart because they were clicked into existence on different days by different people.
2. **No review.** A security-group change that opens a port to the world gets no diff, no PR, no second pair of eyes.
3. **No rollback.** "Undo" is "remember what you changed and change it back." Drift accumulates.
4. **No knowledge transfer.** The infra lives in one person's head and in the console. When they leave, so does it.

IaC fixes all four by making infrastructure *code*: diffed in PRs, reviewed, versioned, and re-runnable. The cost is a learning curve and some up-front setup — which is exactly why you don't pay it before you need it (see [match rigor to stage](#match-rigor-to-project-stage)).

## CDK vs. Terraform — pick by team, not by hype

Both define infra as code and both are good. The choice is mostly about your team and how multi-cloud you really are.

| | **AWS CDK** | **Terraform / OpenTofu** |
|---|---|---|
| **You write** | Python / TypeScript (real code: loops, types, classes) | HCL (declarative config) |
| **Clouds** | AWS-only (CDK for Terraform exists but is niche) | Multi-cloud, huge provider ecosystem |
| **State** | Managed via CloudFormation | You manage state (S3 + DynamoDB lock), explicitly |
| **Mental model** | Imperative code that *synthesizes* templates | Declarative desired-state, `plan`/`apply` |
| **Best when** | All-in on AWS; team already writes Python/TS | Multi-cloud, or you want an explicit `plan` diff and a mature module registry |
| **The catch** | CloudFormation's quirks leak through; drift detection is weaker | HCL isn't a real language; state files are a footgun if mishandled |

**For a Python team going all-in on AWS, CDK is the natural fit** — same language as the app, real abstractions, no new syntax. **If you're multi-cloud or want the explicit `terraform plan` diff before every change, Terraform wins.** OpenTofu is the open-source Terraform fork; treat it as a drop-in. There is no wrong answer here; there's only "the one your team will actually maintain."

## What goes in the stack — and how it mirrors your adapters

Here's the part that ties back to the architecture: **your IaC stack is your adapter list, made real.** Every external seam your app talks to through a port corresponds to one provisioned resource.

| App port / adapter | Resource the stack provisions |
|---|---|
| `ListRepository` → Postgres | **RDS / Aurora** (instance, subnet group, parameter group) |
| `Cache` → Redis | **ElastiCache** (cluster, subnet group) |
| `Queue` → SQS | **SQS queue** (+ dead-letter queue) |
| `Storage` → S3 | **S3 bucket** (+ policy, lifecycle rules) |
| `Notifier` → email | **SES** (identity, config set) |
| the app itself | **ECS Fargate service** (task def, ALB, target group, autoscaling) |
| all of it | **VPC, subnets, security groups, IAM roles** (the wiring) |

This isn't a coincidence. The dependency rule says infrastructure lives at the edges behind ports; IaC is the same list of edges, expressed as cloud resources. If you can name your adapters, you can sketch your stack — and if your stack has a resource no adapter talks to, ask why it's there.

A CDK sketch reads almost like the table:

```python
# infra/app_stack.py — illustrative, AWS CDK (Python)
class AppStack(Stack):
    def __init__(self, scope, id_, **kwargs):
        super().__init__(scope, id_, **kwargs)
        vpc   = ec2.Vpc(self, "Vpc", max_azs=2)
        db    = rds.DatabaseInstance(self, "Db", engine=POSTGRES, vpc=vpc)
        cache = elasticache.CfnCacheCluster(self, "Cache", engine="redis", ...)
        queue = sqs.Queue(self, "Jobs", dead_letter_queue=dlq)
        bucket = s3.Bucket(self, "Uploads")
        # Fargate service gets the endpoints injected as env — same vars the
        # container reads locally, just pointing at managed services now.
        ApplicationLoadBalancedFargateService(self, "Api",
            vpc=vpc, task_image_options=TaskImageOptions(
                image=ContainerImage.from_asset("."),     # the prod Dockerfile target
                environment={"DATABASE_URL": db_url, "REDIS_HOST": cache_host,
                             "QUEUE_URL": queue.queue_url, "APP_ENV": "prod"}))
```

Note the last lines: the stack's job is to **inject the right endpoints as environment variables** — the exact swap point from [containerization.md](./containerization.md). Infra creates the managed services; config points the image at them; the app code is untouched.

## How to spot trouble in an IaC setup

- **Console changes that aren't in code.** Drift. Run `cdk diff` / `terraform plan` — if it shows changes nobody made in code, someone clicked.
- **Terraform state in git or on a laptop.** State belongs in a locked remote backend (S3 + DynamoDB lock). Local state is a "two people applied at once and corrupted prod" waiting to happen.
- **One giant stack/module for everything.** Network, data, and app in one file means every change risks everything. Split by lifecycle (slow-changing network vs. fast-changing app).
- **Secrets hardcoded in the IaC.** DB passwords in HCL/CDK source. Use Secrets Manager / SSM Parameter Store and reference them.
- **No `plan`/`diff` in CI.** Changes apply without anyone seeing the diff first. The whole point was review.
- **IaC for an app that has one container and no managed services.** Over-engineering — see below.

## Match rigor to project stage

This is the most important section, because IaC is the easiest thing on this list to over-do. **Reaching for Terraform + Fargate + a VPC for an app three people use is premature scaling** — the exact trap [performance.md](./performance.md) warns about, applied to infra.

| Signal | What's appropriate |
|---|---|
| MVP, one container, no managed services | A PaaS — **Fly.io, Railway, Render, App Runner**. No IaC. Push and go. |
| One app + a managed DB | The PaaS's managed Postgres, or a *single small* CDK/Terraform stack. |
| Multiple managed services (RDS + cache + queue) | One IaC stack. Now reproducibility actually pays off. |
| Staging + prod must match | IaC with environment parameters — same code, different config. This is the sweet spot. |
| Multiple teams / compliance / multi-region | Split stacks, remote state with locking, a `plan` step gated in CI. |
| Genuinely multi-cloud | Terraform/OpenTofu. (Be honest about whether you're *actually* multi-cloud.) |

The rent test applies here too: **don't provision a resource for a future you can't name.** A read replica before you have read load, a multi-region setup before you have one region's worth of users, Kubernetes before you have services to orchestrate — all the same mistake. Start with the smallest thing that reproduces your environment, and add resources when a real signal demands them.

## The architecture connection

IaC is the dependency rule expressed in cloud resources. The app's `bootstrap` layer wires adapters to services; the IaC stack wires *managed services to the app* — and the two lists are the same list. A clean architecture makes the stack legible: every resource exists because some port needs it, and the stack's only job is to create those resources and inject their endpoints as config.

When infra is tangled — resources nobody can trace to a feature, secrets inline, state on a laptop — it's usually downstream of tangled code, where infrastructure was never cleanly separated behind ports in the first place. **A stack you can read top-to-bottom comes from an app whose adapters you can list. Both are the dependency rule, just at different altitudes.**

## Self-check

1. What four things does ClickOps cost you that IaC gives back?
2. Your team writes Python and is all-in on AWS. CDK or Terraform — and why?
3. Why is your IaC stack "the same list" as your app's adapters?
4. Where does Terraform state belong, and why not in git?
5. Three people use your app. Is reaching for Terraform + Fargate + a VPC the right call? What would be?

## Things to steal

- **Environments should be one command to create and one to destroy.** If staging is folklore, you don't have infra.
- **IaC = infra in PRs.** Diffed, reviewed, versioned, rollback-able. That's the entire value.
- **CDK if you're all-in on AWS and write Python/TS; Terraform if multi-cloud or you want the explicit `plan` diff.** No wrong answer — pick what the team will maintain.
- **Your stack is your adapter list.** Every port → one managed resource. If a resource has no adapter, question it.
- **The stack's real job is injecting endpoints as env** — the same swap point as the container.
- **State goes in a locked remote backend. Secrets go in a secrets manager.** Never in git, never on a laptop.
- **Don't IaC a single container.** Use a PaaS until managed services make reproducibility pay off.
- **Rent-test every resource.** No replica/region/cluster for a future you can't name yet.
