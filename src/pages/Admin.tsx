import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";

interface Subscriber {
  id: string;
  email: string;
  creation_date: string;
  tags: string[];
}

const Admin = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://api.buttondown.com/v1/subscribers", {
        method: "GET",
        headers: {
          "Authorization": "Token 889d7498-8e58-4fe8-8e63-e99395b5b741",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.results || data);
        toast.success(`Loaded ${data.results?.length || data.length} subscribers`);
      } else {
        toast.error("Failed to fetch subscribers");
      }
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Failed to load subscribers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-blush/10 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <Users className="w-8 h-8 text-mint" />
                  Snapfox Waitlist
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  Manage your subscribers
                </CardDescription>
              </div>
              <Button
                onClick={fetchSubscribers}
                disabled={isLoading}
                variant="outline"
                size="lg"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-mint/10 rounded-lg">
              <p className="text-lg font-semibold">
                Total Subscribers: {subscribers.length}
              </p>
            </div>

            <div className="space-y-2">
              {subscribers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No subscribers yet. Start promoting your waitlist!
                </p>
              ) : (
                subscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-mint" />
                      <div>
                        <p className="font-medium">{subscriber.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined: {new Date(subscriber.creation_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {subscriber.tags && subscriber.tags.length > 0 && (
                      <div className="flex gap-2">
                        {subscriber.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-mint/20 text-mint text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
