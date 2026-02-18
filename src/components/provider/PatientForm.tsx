import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
const patientSchema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid format'),
  gender: z.enum(['Male', 'Female', 'Other']),
  bloodType: z.string().min(1, 'Required'),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'Format: ###-##-####'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone'),
  address: z.string().min(5, 'Required'),
  history: z.string().optional(),
});
type PatientFormValues = z.infer<typeof patientSchema>;
interface PatientFormProps {
  onSubmit: (data: PatientFormValues) => void;
  isLoading?: boolean;
}
export function PatientForm({ onSubmit, isLoading }: PatientFormProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: '', lastName: '', dob: '', gender: 'Male',
      bloodType: 'O+', ssn: '', email: '', phone: '', address: '', history: '',
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">First Name</FormLabel>
              <FormControl><Input placeholder="John" {...field} className="h-9 rounded-md text-xs border-slate-200" /></FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Name</FormLabel>
              <FormControl><Input placeholder="Doe" {...field} className="h-9 rounded-md text-xs border-slate-200" /></FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />
          <FormField control={form.control} name="dob" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">DOB</FormLabel>
              <FormControl><Input type="date" {...field} className="h-9 rounded-md text-xs border-slate-200" /></FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />
          <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="h-9 rounded-md text-xs border-slate-200"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent className="text-xs">
                  <SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Address</FormLabel>
            <FormControl><Input placeholder="123 Medical Dr, City, ST" {...field} className="h-9 rounded-md text-xs border-slate-200" /></FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        <FormField control={form.control} name="history" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Clinical History</FormLabel>
            <FormControl><Textarea placeholder="Chief complaint, allergies, surgical history..." {...field} className="rounded-md text-xs border-slate-200 min-h-[80px]" /></FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isLoading} className="bg-teal-700 hover:bg-teal-800 rounded-md px-8 h-10 text-xs font-bold uppercase tracking-widest">
            {isLoading ? "Committing..." : "Onboard Patient"}
          </Button>
        </div>
      </form>
    </Form>
  );
}