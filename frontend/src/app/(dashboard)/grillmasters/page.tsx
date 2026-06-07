"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface Grillmaster {
  id: string;
  userId: string;
  bio: string;
  experience: number;
  pricePerHour: number;
  available: boolean;
  city: string;
  state: string;
  rating: number;
  totalOrders: number;
  approved: boolean;
  user: {
    name: string;
    email: string;
    phone: string;
  };
}

interface GrillmastersResponse {
  grillmasters: Grillmaster[];
  total: number;
  page: number;
  totalPages: number;
}

export default function GrillmastersPage() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [grillmasters, setGrillmasters] = useState<Grillmaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "pricePerHour" | "experience">("rating");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
  fetchGrillmasters();
  }, [token, page, availableOnly, sortBy]);

  async function fetchGrillmasters() {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        limit: 9,
        sortBy,
      };
      if (availableOnly) params.available = true;
      if (cityFilter.trim()) params.city = cityFilter.trim();

      const { data } = await api.get<GrillmastersResponse>("/grillmasters", { params });
      setGrillmasters(Array.isArray(data) ? data : data.grillmasters ?? []);;
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setError("NÃ£o foi possÃ­vel carregar os churrasqueiros. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchGrillmasters();
  }

  const filtered = grillmasters.filter((g) => {
    const name = g.user?.name?.toLowerCase() ?? "";
    const bio = g.bio?.toLowerCase() ?? "";
    const q = search.toLowerCase();
    return name.includes(q) || bio.includes(q);
  });

  function renderStars(rating: number) {
    const stars = [];
    const full = Math.floor(rating);
    const partial = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < full) stars.push("â˜…");
      else if (i === full && partial) stars.push("Â½");
      else stars.push("â˜†");
    }
    return stars.join("");
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  const avatarColors = [
    "#C23B22", "#D4572B", "#B8340C", "#8B2500",
    "#A0360A", "#E06030", "#CC4515", "#9B2D0E",
  ];

  function getAvatarColor(name: string) {
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % avatarColors.length;
    return avatarColors[hash];
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", fontFamily: "'Georgia', serif" }}>
      {/* Header */}
      <div style={{
        background: "#1A0A00",
        padding: "2rem 2.5rem 1.5rem",
        borderBottom: "3px solid #C23B22",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 32 }}>🔥</span>
                <div>
                  <h1 style={{ margin: 0, color: "#FFFFFF", fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>
                    Churrasqueiros
                  </h1>
                  <p style={{ margin: 0, color: "#D4957A", fontSize: 13 }}>
                    Mestres da brasa disponÃ­veis pra seu evento
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                background: "transparent",
                border: "1px solid #C23B22",
                color: "#D4957A",
                borderRadius: 8,
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              â† Voltar ao dashboard
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Filters */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E8E0D8",
          borderRadius: 12,
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}>
          <div style={{ flex: "2 1 200px" }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Buscar por nome ou bio</label>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="Ex: JoÃ£o, especialista em picanha..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #DDD",
                  fontSize: 14, background: "#FAFAF8", outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#C23B22", color: "#FFF", border: "none",
                  borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontSize: 13,
                }}
              >
                Buscar
              </button>
            </form>
          </div>

          <div style={{ flex: "1 1 140px" }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Cidade</label>
            <input
              type="text"
              placeholder="Ex: SÃ£o Paulo"
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #DDD",
                fontSize: 14, background: "#FAFAF8", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ flex: "1 1 140px" }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #DDD",
                fontSize: 14, background: "#FAFAF8", outline: "none", cursor: "pointer",
              }}
            >
              <option value="rating">Melhor avaliaÃ§Ã£o</option>
              <option value="pricePerHour">Menor preÃ§o</option>
              <option value="experience">Mais experiente</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 2 }}>
            <input
              type="checkbox"
              id="available"
              checked={availableOnly}
              onChange={(e) => { setAvailableOnly(e.target.checked); setPage(1); }}
              style={{ cursor: "pointer", accentColor: "#C23B22", width: 16, height: 16 }}
            />
            <label htmlFor="available" style={{ fontSize: 13, color: "#555", cursor: "pointer" }}>
              Apenas disponÃ­veis
            </label>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#FFF0EE", border: "1px solid #F0B0A0", borderRadius: 10,
            padding: "12px 16px", marginBottom: "1.5rem", color: "#A32D2D", fontSize: 14,
          }}>
            âš ï¸ {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                background: "#FFF", border: "1px solid #E8E0D8", borderRadius: 14,
                padding: "1.5rem", animation: "pulse 1.5s ease-in-out infinite",
              }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EEE", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 16, background: "#EEE", borderRadius: 4, marginBottom: 8, width: "70%" }} />
                    <div style={{ height: 12, background: "#EEE", borderRadius: 4, width: "50%" }} />
                  </div>
                </div>
                <div style={{ height: 12, background: "#EEE", borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 12, background: "#EEE", borderRadius: 4, width: "80%" }} />
              </div>
            ))}
          </div>
        )}

        {/* Results count */}
        {!loading && !error && (
          <p style={{ fontSize: 13, color: "#888", marginBottom: "1rem" }}>
            {filtered.length} churrasqueiro{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Grid */}
        {!loading && filtered.length === 0 && !error && (
          <div style={{
            textAlign: "center", padding: "4rem 2rem",
            background: "#FFF", border: "1px solid #E8E0D8", borderRadius: 14,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>ðŸ¥©</div>
            <p style={{ color: "#888", fontSize: 15 }}>Nenhum churrasqueiro encontrado com esses filtros.</p>
            <button
              onClick={() => { setSearch(""); setCityFilter(""); setAvailableOnly(false); setPage(1); fetchGrillmasters(); }}
              style={{
                marginTop: 12, background: "#C23B22", color: "#FFF", border: "none",
                borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14,
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {filtered.map((g) => {
              const name = g.user?.name ?? "Churrasqueiro";
              const avatarBg = getAvatarColor(name);
              return (
                <div
                  key={g.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E8E0D8",
                    borderRadius: 14,
                    overflow: "hidden",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                >
                  {/* Card top bar */}
                  <div style={{ height: 6, background: g.available ? "#C23B22" : "#CCCCCC" }} />

                  <div style={{ padding: "1.25rem 1.25rem 1rem" }}>
                    {/* Header */}
                    <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                        background: avatarBg, display: "flex", alignItems: "center",
                        justifyContent: "center", color: "#FFF", fontSize: 18, fontWeight: 700,
                      }}>
                        {getInitials(name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1A0A00", lineHeight: 1.2 }}>
                            {name}
                          </h3>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
                            background: g.available ? "#FFF0EE" : "#F5F5F5",
                            color: g.available ? "#C23B22" : "#999",
                            whiteSpace: "nowrap", flexShrink: 0,
                          }}>
                            {g.available ? "â— DisponÃ­vel" : "â— Ocupado"}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <span style={{ color: "#E09000", fontSize: 14 }}>{renderStars(g.rating ?? 0)}</span>
                          <span style={{ fontSize: 12, color: "#888" }}>
                            {(g.rating ?? 0).toFixed(1)} ({g.totalOrders ?? 0} pedidos)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <p style={{
                      fontSize: 13, color: "#555", lineHeight: 1.5, margin: "0 0 12px",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {g.bio || "Especialista em grelhados e churrasco artesanal."}
                    </p>

                    {/* Details */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                      <span style={{
                        fontSize: 12, padding: "4px 10px", background: "#FFF8F4",
                        border: "1px solid #F0D8D0", borderRadius: 20, color: "#8B3A1A",
                      }}>
                        ðŸ“ {g.city}, {g.state}
                      </span>
                      <span style={{
                        fontSize: 12, padding: "4px 10px", background: "#FFF8F4",
                        border: "1px solid #F0D8D0", borderRadius: 20, color: "#8B3A1A",
                      }}>
                        ðŸ† {g.experience} {g.experience === 1 ? "ano" : "anos"} exp.
                      </span>
                    </div>

                    {/* Price + CTA */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      borderTop: "1px solid #F0E8E0", paddingTop: 12,
                    }}>
                      <div>
                        <span style={{ fontSize: 11, color: "#999", display: "block" }}>DiÃ¡ria</span>
                        <span style={{ fontSize: 20, fontWeight: 700, color: "#C23B22" }}>
                          R$ {(g.pricePerHour ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <button
                        disabled={!g.available}
                        onClick={() => router.push(`/dashboard/orders/new?grillmasterId=${g.id}`)}
                        style={{
                          background: g.available ? "#C23B22" : "#DDD",
                          color: g.available ? "#FFF" : "#999",
                          border: "none", borderRadius: 8,
                          padding: "10px 18px", cursor: g.available ? "pointer" : "not-allowed",
                          fontSize: 13, fontWeight: 600,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (g.available) (e.currentTarget as HTMLButtonElement).style.background = "#A32D2D";
                        }}
                        onMouseLeave={(e) => {
                          if (g.available) (e.currentTarget as HTMLButtonElement).style.background = "#C23B22";
                        }}
                      >
                        {g.available ? "Contratar" : "IndisponÃ­vel"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: "2rem" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "1px solid #DDD",
                background: page === 1 ? "#F5F5F5" : "#FFF",
                color: page === 1 ? "#BBB" : "#333",
                cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 13,
              }}
            >
              â† Anterior
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: 13,
                  border: page === i + 1 ? "none" : "1px solid #DDD",
                  background: page === i + 1 ? "#C23B22" : "#FFF",
                  color: page === i + 1 ? "#FFF" : "#333",
                  cursor: "pointer", fontWeight: page === i + 1 ? 700 : 400,
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "1px solid #DDD",
                background: page === totalPages ? "#F5F5F5" : "#FFF",
                color: page === totalPages ? "#BBB" : "#333",
                cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 13,
              }}
            >
              PrÃ³xima â†’
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

