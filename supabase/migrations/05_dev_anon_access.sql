-- Temporary development policies to bypass RLS for anon users until Auth is implemented.

CREATE POLICY "Allow all operations for anon on organizations" ON public.organizations FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on principals" ON public.principals FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on dynamic_forms" ON public.dynamic_forms FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on dynamic_form_submissions" ON public.dynamic_form_submissions FOR ALL USING (true);

CREATE POLICY "Allow all operations for anon on stakeholders" ON public.stakeholders FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on objectives" ON public.objectives FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on journals" ON public.journals FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on capsules" ON public.capsules FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on deliverables" ON public.deliverables FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on outcomes" ON public.outcomes FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on org_documents" ON public.org_documents FOR ALL USING (true);

CREATE POLICY "Allow all operations for anon on engagements" ON public.engagements FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on consulting_resources" ON public.consulting_resources FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on software_deployments" ON public.software_deployments FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on uat_sessions" ON public.uat_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on adoption_metrics" ON public.adoption_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on communication_plans" ON public.communication_plans FOR ALL USING (true);
