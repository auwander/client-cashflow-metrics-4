import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, isBefore, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Users } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: allClients, count: totalCount } = await supabase
        .from("client_subscriptions")
        .select("id", { count: "exact", head: true });

      // Get all subscriptions to check due dates
      const { data: subscriptions } = await supabase
        .from("client_subscriptions")
        .select("due_date, amount, payment_status");

      // Count overdue subscriptions (due_date is before today)
      const overdueCount = subscriptions?.filter(sub => 
        isBefore(parseISO(sub.due_date), new Date()) && 
        sub.payment_status !== 'inactive'
      ).length || 0;

      // Count subscriptions due today
      const dueTodayCount = subscriptions?.filter(sub => 
        format(parseISO(sub.due_date), 'yyyy-MM-dd') === today
      ).length || 0;

      // Calculate monthly revenue from active subscriptions
      const monthlyRevenue = subscriptions?.reduce((acc, curr) => {
        if (curr.payment_status === 'active') {
          return acc + Number(curr.amount);
        }
        return acc;
      }, 0) || 0;

      return {
        totalClients: totalCount || 0,
        overdueClients: overdueCount,
        dueTodayClients: dueTodayCount,
        monthlyRevenue: monthlyRevenue,
      };
    },
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-4">
          <Button
            onClick={() => navigate("/subscriptions")}
            variant="outline"
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Users className="h-4 w-4" />
            Visualizar Clientes
          </Button>
          <Button
            onClick={() => navigate("/home")}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Cadastrar Cliente
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients}</div>
          </CardContent>
        </Card>

        <Card 
          className="w-full cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => navigate("/subscriptions?filter=inactive")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Inadimplentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.overdueClients}</div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vencimentos Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.dueTodayClients}</div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats?.monthlyRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}