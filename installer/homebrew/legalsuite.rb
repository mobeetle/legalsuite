class Legalsuite < Formula
  desc "Legal skill suite (plaintext skills + Python/Node scripts)"
  homepage "https://legalskills.cz"
  # Unsigned source install: no cert needed for a formula.
  url "https://legalskills.cz/releases/legalsuite-2.0.0.tar.gz"
  version "2.0.0"
  depends_on "python@3.12" => :optional
  depends_on "node@20" => :optional

  def install
    libexec.install Dir["skills", "commands", "scripts", "install.sh"]
    # Open playbooks only; the commercial packs are not in the formula's source.
    (libexec/"playbooks").install "playbooks/README.md", "playbooks/_template.md",
                                  "playbooks/_template-intake-matrix.md"
    bin.write_exec_script libexec/"install.sh"
  end

  def caveats
    <<~EOS
      Finish with: legalsuite --runtime auto ~/.config/opencode
      (or install.sh --runtime node for the JS flavor).
    EOS
  end
end
