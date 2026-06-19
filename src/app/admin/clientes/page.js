import { getClients } from "../../../app/actions/clients";
import ClientTableClient from "../../../components/ClientTableClient";

export default async function ClientesPage() {
  const clients = await getClients();

  return (
    <div className="p-4 bg-white min-h-screen antialiased text-black">
      <ClientTableClient initialClients={clients} />
    </div>
  );
}